$(".home").click(function(){ 
  document.getElementById("note").style.opacity = "0";
  $(".note").css("width","0%");
  $(".pod").css("width","96%");
  $("#map").css("height","310px");
  $(".pod").css("transform","rotate(0deg)");
  $(".pod").css("transform","translateX(0px)");
  document.getElementById("plate").style.opacity = "1";
  
  
  
});

$(".save").click(function(){ 
  $("#map").css("width","65%");
  $("#map").css("float","right");
  document.getElementById("e").style.opacity = "1";
  $("#e").css("float","left");
  $("#e").css("width","25%");
  $("#e").css("padding","10px");
  $("#e").css("margin","0px 0px 0px 10px");
  document.getElementById("check_list").style.opacity = "1";
  
});

/** 地圖 **/

var points_list={};
points_list.list = [
  //{lat:xxx,lng:xxx}
];
var routepoint=[];
var mk = {};
mk.list=[];
var geocoder;
var infowindow;
var place_id;
var map;
function initMap() {
  geocoder = new google.maps.Geocoder();
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.744, lng:-73.986},
    zoom: 12
  });
  directionsDisplay.setMap(map);
  
  var geocoder = new google.maps.Geocoder;
  var infowindow = new google.maps.InfoWindow;
  
  document.getElementById('save').addEventListener('click', function() {
    get_time_array();
    geocodeLatLng(geocoder, map, infowindow);
    calculateAndDisplayRoute(directionsService, directionsDisplay);

        });
  
  map.addListener('click', function(e) {
    placeMarkerAndPanTo(e.latLng, map);
  });
  
  document.getElementById('addbtn').addEventListener('click', function(){
    codeAddress(geocoder,map);
  });
}



/** 當使用者點選地標之後 在html響應顯示資料 **/

function placeMarkerAndPanTo(latLng, map) {
  var marker = new google.maps.Marker({
    position: latLng,
    map: map
  });
  map.panTo(latLng);
  var point = latLng;
  lat = latLng.lat();
  lng = latLng.lng();
  var str1 = ""+lat;
  var s1 = str1.substr(0,6);
  var str2 = ""+lng;
  var s2 = str2.substr(0,6);
  var text_short = s1+", "+s2;
  var text = lat+","+lng;
  console.log(text);
  points_list.list.push(
      {
        latlng:text,
        points:point,
        short_text:text_short
      }
    );
  var myLatLng = new google.maps.LatLng({lat: lat, lng: lng});
  routepoint.push(myLatLng);
  console.log(routepoint);
  
  mk.list.push(marker);
  showlist();
}
/** 輸入地址轉經緯度 **/

function codeAddress(geocoder,map) {
    var address = document.getElementById('input_adr').value;
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
       console.log("oop"); //console.log(results[0].geometry.location.lat(),results[0].geometry.location.lng());
        placeMarkerAndPanTo(results[0].geometry.location, map);
        $("#input_adr").val("");
        /*
        var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });*/
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
}

//定義元素用的html模板，{{名稱}}代表要套入的地方
var item_html="<ul id={{id}} class='points'><div class='latlng'>{{latlng}}</div><input id={{id_time}} placeholder={{input_t}}></input><div id={{del_id}} data-delid={{del_item_id}} class='del_btn'>✕</div></ul>";
//var item_html_2="<ul id={{id}} class='points'><div class='latlng'>{{latlng}}</div><input id={{id_time}} placeholder={{input_t}}></input><div id={{del_id}} data-delid={{del_item_id}} class='del_btn'>✕</div></ul>";

//刪除並重新產生清單中所有項目
function showlist(){
  $("#latlng").html("");
  //把每個項目做出來
  for(var i=0;i<points_list.list.length;i++){
    var item=points_list.list[i];
    var item_id="point_"+i;
    var del_item_id="del_"+i;
    var time_id="time_"+i;
    var num= i+1;
    
    //取代模板位置成資料replace(要取代的,取代成...)
    //item.latlng
    var current_item_html=
        item_html.replace("{{id}}",i+1)
                 .replace("{{latlng}}","地點"+num+" :   "+item.short_text)
                  .replace("{{id_time}}",time_id)
                  .replace("{{input_t}}","時間...")
                 .replace("{{del_id}}",del_item_id)
                 .replace("{{del_item_id}}",i)

    ;
    $("#latlng").append(current_item_html);
    $("#"+del_item_id).click(
      function(){
        remove_item(parseInt($(this).attr("data-delid")));
      }
    );
  }
}
showlist();

//刪除點選地標
function remove_item(id){
  mk.list[id].setMap(null);
  mk.list.splice(id,1);
  points_list.list.splice(id,1);
  showlist();
  console.log(points_list.list)
}




/** 使用者輸入的時間陣列 time_array **/
//送出之後，用 time_array 依序儲存地點拜訪「時間」

var time_array = [];
var point_array = [];

function get_time_array(){
  //console.log("e");
  for(var i=0;i<points_list.list.length;i++){
    //console.log(i);
    var timeId = "time_"+i;
    var time = document.getElementById(timeId).value;
    
    
    /***************** 傳給後端的 ********************/
    time_array.push(time);
    point_array.push(points_list.list[i].latlng);
    /***************** 傳給後端的 ********************/
    
  }
  console.log(time_array);
  console.log(point_array);
}



/** 規劃路線 使用directionsService及directionsDisplay**/

var output = [];

//outputlatlng儲存使用者選取地點
var outputlatlng = [];


/***************** 後端傳來的 ********************/
//預測所得到的推薦地點 [經度,緯度,類型,拜訪時間,推薦強度]
var predict_pnts = [40.714899,-74.002812, 'park',13,'0.831'];
//var predict_pnts = [40.74916954025589,-73.98874658203124, 'park',13,'0.831'];
/***************** 後端傳來的 ********************/

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  for (var i = 0; i < points_list.list.length; i++) {
      output.push(points_list.list[i].latlng);
      outputlatlng.push(points_list.list[i].points);
  }
  
  var waypts = [];
  for (var i = 1 ; i<outputlatlng.length;i++){
    waypts.push({
      location: outputlatlng[i],
      stopover: true
      });
  }
  
  // 建立預測點在地圖上的marker及資訊視窗（游標浮動時顯示）
  var marker = new google.maps.Marker({
    position: {lat: predict_pnts[0], lng: predict_pnts[1]},
    title:"推薦地點"+"\n"+"經度："+predict_pnts[0]+"\n"+"緯度："+predict_pnts[1]+"\n"+"類型："+predict_pnts[2]+"\n"+"建議拜訪時間："+predict_pnts[3]+"點\n"+"推薦強度："+predict_pnts[4],
    map: map
  });
  map.panTo({lat: predict_pnts[0], lng: predict_pnts[1]});
  //map.panTo({lat: predict_pnts[0], lng: predict_pnts[1]});
  
  directionsService.route({
    origin: outputlatlng[0],
    //destination: outputlatlng[outputlatlng.length-1],
    destination:{lat: predict_pnts[0], lng: predict_pnts[1]},
    waypoints: waypts,
    optimizeWaypoints: true,
    travelMode: 'DRIVING'
    },function(response, status) {
          if (status == 'OK') {
            directionsDisplay.setOptions({
            polylineOptions: {
                              strokeColor: 'orange'
                               },
            suppressMarkers: true
           });
            
            directionsDisplay.setDirections(response);
            var route = response.routes[0];
            var summaryPanel = document.getElementById('directions-panel');
            
            var myRoute = directionResult.routes;
            //console.log(myRoute);
            summaryPanel.innerHTML = '';
            // For each route, display summary information.
            /*for (var i = 0; i < route.legs.length; i++) {
              var routeSegment = i + 1;
              summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
                  '</b><br>';
              summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
              summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
              summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
          }*/
          }/*
    else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                wait = true;
                setTimeout("wait = true", 2000);
                //alert("OQL: " + status);
              }*/
    else{
            window.alert('Directions request failed due to ' + status);
          }
  }
                          
);
  
}



/** POI圓餅圖 **/

/***************** 後端傳來的 ********************/
var poi = [10,7,30,20,16,10,5,3];
/***************** 後端傳來的 ********************/

var chart = c3.generate({
  padding: {
  
    left: 50
  },
  size: {
    width: 200
},
  bindto: ".e",
  data: { //這裡需要用變數取代
    columns: [["藝術文化", poi[0]], ["學習教育", poi[1]], ["飲食相關", poi[2]],["夜生活場所",poi[3]],["戶外活動",poi[4]],["企業與辦公",poi[5]],["消費服務",poi[6]],["旅遊交通",poi[7]]],
    type: "pie",
    colors: {
      /*park: "#C14242",
      school: "#722626",
      food: "#D47777",
      station: "#EDC4C4",
      bakery: "#ED7272",
      bank: "#72AFED",
      post_station: "#1F6FAC",
      shopping: "#BDDCF4",
      government: "#0F97FF",
      hospital: "#124063"*/
    }
  },
  pie: {
    label: {
      format: function(value, ratio, id) {
        return value + "%";
      }
    }
  }
});


/** 從地點經緯度(後端傳來的預測點) 利用geocoder 
取得地點的place_id 並執行 geoName function**/

function geocodeLatLng(geocoder, map, infowindow) {
  
        var latlng = {lat: predict_pnts[0], lng: predict_pnts[1]};
  
        geocoder.geocode({'location': latlng}, function(results, status) {
          if (status === 'OK') {
            if (results[0]) {
              map.setZoom(11);
              var marker = new google.maps.Marker({
                position: latlng,
                map: map
              });
              place_id = results[0].place_id;
              //console.log(place_id);
              geoName(place_id, map, infowindow);
              
            } else {
              window.alert('No results found');
            }
          } else {
            window.alert('Geocoder failed due to: ' + status);
          }
        });
  
  
  
}
 

/** 從地點 place_id 利用plaes API取得 地點名稱 並由infowindow顯示資訊**/

function geoName(place_id, map, infowindow){
  //console.log("ok");
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
          placeId: place_id
        }, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            //console.log("ok");
            var marker = new google.maps.Marker({
              map: map,
              position: place.geometry.location
            });
            infowindow.setContent("<div><b>"+place.name+"</b><br>"+"<b>地址：</b>"+place.formatted_address+"<br><b>類型：</b>"+predict_pnts[2]+"<br>"+"<b>推薦時間：</b>"+predict_pnts[3]+"點"+"<br>"+"<b>推薦強度：</b>"+predict_pnts[4]+"</div>");
            
            google.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map, marker);
            });
            infowindow.open(map, marker);
            
          }
        });
}



/** 利用toggle 顯示POI **/
/*藝術文化","學習教育","飲食相關""夜生活場所","戶外活動","企業與辦公","消費服務","旅遊交通"*/

// POI = [經度,緯度,type,typeID]
/*********************************** 後端傳來的 **************************************/
point_arr = [[40.72081340981711,-73.98256677246093,'藝術文化','1'],[40.71895943460516,-73.99595635986327,'學習教育','2'],[40.72624493466232,-73.99629968261718,'飲食相關','3'],[40.7102418063902,-74.00488275146483,'夜生活場所','4'],[40.71573924966973,-73.9811934814453,'戶外活動','5'],[40.712128554058125,-73.99286645507811,'企業與辦公','6'],[40.71632474942566,-74.00694268798827,'消費服務','7'],[40.7233828690311,-74.00659936523436,'旅遊交通','8']];
/*********************************** 後端傳來的 **************************************/

var icons = {
	  1: {
		icon: './images/icon01.png',
		type: '藝術文化'
	  },
	  2: {
		icon: './images/icon02.png',
		type: '學習教育'
	  },
	  3: {
		icon: './images/icon03.png',
		type: '飲食相關'
	  },
    4: {
		icon: './images/icon04.png',
		type: '夜生活場所'
	  },
    5: {
		icon: './images/icon05.png',
		type: '戶外活動'
	  },
    6: {
		icon: './images/icon06.png',
		type: '企業與辦公'
	  },
    7: {
		icon: './images/icon07.png',
		type: '消費服務'
	  },
    8: {
		icon: './images/icon08.png',
		type: '旅遊交通'
	  }
}
var markers = [];
var empty = [];
var check = [];
var checkBox;
function unchecked(){
  document.getElementById("q1").checked = false;
	//document.getElementById("q2").checked = false;
}

// Q1 data layer1 for crim type in each beat
$(document).ready(function(){
  $('#q1').click(function(event){
    if (event.target.checked == true){
      
      document.getElementById("s1").style.backgroundColor = "#f4cb58";
      //console.log("g");
      //remove(check,checkBox);
      //clear();
      
      
			point_arr.forEach(function(point) {
      marker2 = new google.maps.Marker({
      position: {lat:point[0],lng:point[1]},
      title: "類型："+point[2],
		  icon: icons[point[3]].icon,
	    map: map
    });
      markers.push(marker2);
  });
		 
      
    }
    else{
      //remove(check,checkBox);
      clear();
      point_arr.forEach(function(point) {
        marker2.setMap(null);
      });
    }
  });
});

/** clear marker **/

function clear(){
	if(markers!=null){
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
		markers = [];
		console.log("CLEAR");
	}
}
function remove(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}