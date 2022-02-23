<template>
  <div id ='map' style="height: 800px">
    

    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content"></div>
    </div>

    <el-checkbox  @change='changeGaoDe'>高德地图</el-checkbox>
    <el-checkbox  @change='changeTianImg_c'>天地图影像</el-checkbox>
    <el-checkbox  @change='changeWuHanDOM'>武汉数字正射影像</el-checkbox>
    <el-checkbox  @change='changeWuHanPOI'>武汉POI</el-checkbox>
    <el-checkbox  @change='changeWuHanRoads'>武汉路网</el-checkbox>
    <el-checkbox  @change="changeWuHanBoudary" >武汉行政区划</el-checkbox>

    <el-checkbox  @change="selectFeature" >识别要素</el-checkbox>

    


    
    

    <div style="display:flex">
      <button @click="startMeasure">开始测距</button>
      <button @click="stopMeasure">清除测距</button>

      
    </div>
     <el-checkbox  @change="changeHand" >是否开启手绘</el-checkbox>
      <el-button @click="drawFeature('Point')">画点</el-button>
      <el-button @click="drawFeature('LineString')">画线</el-button>
      <el-button @click="drawFeature('Polygon')">画面</el-button>
      <el-button @click="drawFeature('Circle')">画圆</el-button>
      <el-button @click="draw.removeLastPoint()">撤回</el-button>
      <el-button @click="map.removeInteraction(draw)">取消</el-button>
      <el-button @click="clearDrawLayer()">清除</el-button>
    <div>

    </div>
  </div>
</template>

<script>
  import 'ol/ol.css'
  import { Map, View } from 'ol'
  import XYZ from 'ol/source/XYZ'
  import { fromLonLat } from 'ol/proj'
  import Overlay from 'ol/Overlay';
  import {Circle as CircleStyle, Fill, Stroke, Style,Circle} from 'ol/style';
  import {TileWMS } from 'ol/source';
  import {Tile } from 'ol/layer';
  import Draw from 'ol/interaction/Draw';
  import { getLength} from 'ol/sphere'; 
  import {unByKey} from 'ol/Observable';
  import 'ol/ol.css';
  import {GeoJSON} from 'ol/format';

  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';


  import axios from 'axios'



  import Select from "ol/interaction/Select";
  import { click } from "ol/events/condition";

  


  // import {toLonLat,transform} from 'ol/proj';
  // import {toStringHDMS} from 'ol/coordinate';


  
  export default {
    name:'LayersTree',
    data(){
      return {
        map:null,
        overlay:null,

        opacity:1,    //初始透明度为1
        // 在绘制时，保存到组件中，为了删除时可以删除
        drawLayers:[],
        drawDoms:[],


        draw_source: new VectorSource(),
        draw_vector: {},
        draw: {},

        boolTrue:true,
        boolFalse:false,

        

        

      }
    },
    methods:{
      initMap(){
        let target ='map';
        let layers = [
          new Tile({
            source:new XYZ({
              url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
            })
          })
        ];
        let view = new View({
          center:fromLonLat([114.5, 30.5]),
          zoom:10,
          projection:'EPSG:3857'
        })
        //将map保存到主键的数据对象中，方便添加图层，因为要绘制点和线，要操作map对象，
        this.map = new Map({    
          target:target,
          layers:layers,
          view:view
        })
      },
      changeGaoDe:function(checked){
        if(checked){
          this.GaoDeLayer = new Tile({
            name:'高德图层',
            source:new XYZ({
              url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
            })
          })
          this.map.addLayer(this.GaoDeLayer);
        }else{
          this.map.removeLayer(this.GaoDeLayer);
        }
      },
      changeTianImg_c:function(checked){
        if(checked){
          this.TianLayerImg = new Tile({
            name:'天地图影像图层',
            source:new XYZ({
              url:'http://t3.tianditu.com/DataServer?T=img_w&tk=a1ab26b7cbbee08dcfa15798f6b89d2e&x={x}&y={y}&l={z}'
            })
          })
          this.map.addLayer(this.TianLayerImg);
        }else{
          this.map.removeLayer(this.TianLayerImg);
        }
      },
      changeWuHanDOM:function(checked){
        if(checked){
          this.WMSLayer = new Tile({
            name:'武汉DOM',
            source:new TileWMS({
              url:'http://localhost:8090/geoserver/wuhan/wms',
              params: { 
                'VERSION': '1.1.1', 
                'FORMAT': 'image/png8' ,
                'LAYERS':'wuhan:wuhandom',
              },
            }),
          })
          this.map.addLayer(this.WMSLayer);
        }else{
          this.map.removeLayer(this.WMSLayer);
        }
      },
      changeWuHanPOI:function(checked){
        if(checked){
          this.WMSLayer = new VectorLayer({
            name:'武汉POI',
            source:new VectorSource({
              format: new GeoJSON(),
              url: 'http://localhost:8090/geoserver/wuhan/wms?service=WMS&version=1.1.0&request=GetMap&layers=wuhan%3Awuhan_poi&bbox=113.711373%2C30.0113281%2C115.0092344%2C31.3287723&width=756&height=768&srs=EPSG%3A3857&styles=&format=application%2Fjson%3Btype%3Dgeojson'
            }),
          })
          this.map.addLayer(this.WMSLayer); 
        }else{
          this.map.removeLayer(this.WMSLayer);
        }
          
      },
      changeWuHanRoads:function(checked){
        if(checked){
          axios({
            methods: "GET",
            url: "http://localhost:8090/geoserver/wuhan/ows",
            params : {
              service : 'WFS',
              version : '1.0.0',
              request : 'GetFeature',
              typeName : 'wuhan:wuhan_roads_result',  //图层名称
              outputFormat : 'application/json'
            }
          })
          .then((res)=>{
            var source = new VectorSource({  
              features: (new GeoJSON({featureProjection:'EPSG:3857'})).readFeatures(res.data)
            })
            this.vectorLayer = new VectorLayer({
              source: source,
            });
            this.map.addLayer(this.vectorLayer);
          }).catch(error=>{
            console.log("请求失败，失败信息："+ error);
          });
        }else{
          this.map.removeLayer(this.vectorLayer);
        }

      },
      changeWuHanBoudary:function(checked){
        if(checked){
          axios({
            methods: "GET",
            url: "http://localhost:8090/geoserver/wuhan/ows",
            params : {
              service : 'WFS',
              version : '1.0.0',
              request : 'GetFeature',
              typeName : 'wuhan:武汉市',  
              outputFormat : 'application/json'
            }
          })
          .then((response)=>{
            var source = new VectorSource({  //这样可以出来结果
              features: (new GeoJSON({featureProjection:'EPSG:3857'})).readFeatures(response.data)
            })
            this.vectorLayer = new VectorLayer({
              source: source,
            });
            this.map.addLayer(this.vectorLayer);
          }).catch(error=>{
            console.log("请求失败，失败信息："+ error);
          });
        }else{
          this.map.removeLayer(this.vectorLayer);
        }
      },

      // 识别要素
      selectFeature:function(checked) {
        if(checked){
          var selectSingleClick = new Select();
          this.map.addInteraction(selectSingleClick);
          this.select = new Select({
            condition: click,
          });
          this.map.addInteraction(this.select);
          this.select.on("select", function (e){
            var features=e.target.getFeatures().getArray();
            if(features.length > 0){
              var feature = features[0];
              var property=feature.getProperties();
              content.innerHTML = "Name:<code>" + property.Name + "</code>";
            }
            console.log(property);
            console.log(property.Name); 
          });  

          // 使用变量存储弹窗所需的 DOM 对象
          var container = document.getElementById("popup");
          var closer = document.getElementById("popup-closer");
          var content = document.getElementById("popup-content");

          // 创建一个弹窗 Overlay 对象
          this.overlay = new Overlay({
              element: container, //绑定 Overlay 对象和 DOM 对象的
              autoPan: true, // 定义弹出窗口在边缘点击时候可能不完整 设置自动平移效果
              autoPanAnimation: {
                  duration: 250 //自动平移效果的动画时间 9毫秒
              }
          });
          // 将弹窗添加到 map 地图中
          this.map.addOverlay(this.overlay);
          let _that = this;
          /**
           * 添加单击响应函数来处理弹窗动作
           */
          this.map.on("click", function(evt) {
              _that.overlay.setPosition(evt.coordinate); //把 overlay 显示到指定的 x,y坐标
          });
          /**
           * 为弹窗添加一个响应关闭的函数
           */
          closer.onclick = function() {
              _that.overlay.setPosition(undefined);
              closer.blur();
              return false;
          };
        }else{
          this.map.removeOverlay(this.overlay);
        }
        
      },

   

      //添加绘制的图层
      addDrawLayer() {
        this.draw_vector = new VectorLayer({
          source: this.draw_source,
          //绘制好后，在地图上呈现的样式
          style: new Style({
            fill: new Fill({
              color: "rgba(110, 200, 105, 0.2)",
            }),
            stroke: new Stroke({
              //边界样式
              color: "#ff2a00",
              width: 3,
            }),
            //点样式继承image
            image: new Circle({
              radius: 7,
              fill: new Fill({
                color: "#ff2a00",
              }),
            }),
          }),
        });
        this.map.addLayer(this.draw_vector);
      },

      //清除绘制图层
      clearDrawLayer() {
        this.map.removeInteraction(this.draw); //移除交互
        this.draw_vector.getSource().clear(); //清除图层上的所有要素
      },

      // 是否开启手画
      changeHand:function(checked){
        if(checked){
          this.freehand = this.$data.boolTrue;
        }else{
          this.freehand = this.$data.boolFalse;
        }

      },
      //绘制点线面
      drawFeature(featureType = "") {
        this.map.removeInteraction(this.draw);
        this.draw = new Draw({
          source: this.draw_source,
          type: featureType,
          freehand:this.freehand,   
        });
        this.map.addInteraction(this.draw);
      },
    
      // 测距功能
      startMeasure: function () {
        const source = new VectorSource();

        const layer = new VectorLayer({
          source: source,
          style: new Style({
            fill: new Fill({
              color: "rgba(255, 255, 255, 0.2)",
            }),
            stroke: new Stroke({
              color: "#ffcc33",
              width: 2,
            }),
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({
                color: "#ffcc33",
              }),
            }),
          }),
        });

        let _this = this;
        // 绘制的要素
        let feature;
        // overlay
        let helpTooltip;    
        let measureTooltip;   
        // dom节点（HTML元素）
        let helpTooltipElement;
        let measureTooltipElement;
        // 交互类 绘制
        let draw;
        let listener;

        // 鼠标移动监听
        // on是map的方法，用来监听事件
        let pointermoveListener = this.map.on("pointermove", function (ev) {
          let helpMsg = "点击地图开始测距";   //覆盖物：帮助信息
          if (feature) {
            helpMsg = "双击地图作为结束点";
          }
          helpTooltipElement.innerHTML = helpMsg;
          helpTooltip.setPosition(ev.coordinate);   //设置覆盖物的位置
          helpTooltipElement.classList.remove("hidden");
        });

        // 绘制
        draw = new Draw({
          source,
          type: "LineString",
          style: new Style({
            fill: new Fill({
              color: "rgba(255, 255, 255, 0.2)",
            }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.5)",
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: "rgba(0, 0, 0, 0.7)",
              }),
              fill: new Fill({
                color: "rgba(255, 255, 255, 0.2)",
              }),
            }),
          }),
        });

        // 监听开始绘制 、
        draw.on("drawstart", function (evt) {
          // set sketch
          feature = evt.feature;

          // /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
          let tooltipCoord = evt.coordinate;

          listener = feature.getGeometry().on("change", function (evt) {
            const geom = evt.target;
            let output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
          });
        });

        this.map.getViewport().addEventListener("mouseout", function () {
          helpTooltipElement.classList.add("hidden");
        });

        // 监听绘制结束
        draw.on("drawend", function () {
          measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
          measureTooltip.setOffset([0, -7]);
          // unset sketch
          feature = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          _this.map.removeInteraction(draw);
          unByKey(listener);
          unByKey(pointermoveListener);
        });

        // 格式化长度
        const formatLength = function (line) {
          const length = getLength(line);
          let output;
          if (length > 100) {
            output = Math.round((length / 1000) * 100) / 100 + " " + "km";
          } else {
            output = Math.round(length * 100) / 100 + " " + "m";
          }
          return output;
        };

        function createHelpTooltip() {
          if (helpTooltipElement) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
          }
          helpTooltipElement = document.createElement("div");
          helpTooltipElement.className = "ol-tooltip hidden";
          helpTooltip = new Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: "center-left",
          });
          _this.map.addOverlay(helpTooltip);
        }

        function createMeasureTooltip() {
          if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
          }
          measureTooltipElement = document.createElement("div");
          measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";    //设置类名方便在修改样式
          measureTooltip = new Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: "bottom-center",
            stopEvent: false,
            insertFirst: false,
          });
          _this.drawDoms.push(measureTooltipElement);
          _this.map.addOverlay(measureTooltip);
        }
        createHelpTooltip();
        createMeasureTooltip();

        this.map.addInteraction(draw);
        this.drawLayers.push(layer);
        this.map.addLayer(layer);
      },
      // 清除测距
      stopMeasure: function () {
        // 图层是一个一个添加上去的，所以写一个循环，全部移除即可
        let layers = this.drawLayers;
        console.log(this.drawDoms);
        for(let i = 0;i < layers.length;i++){
          this.map.removeLayer(layers[i]);
        }
        for(let i = 0;i < this.drawDoms.length;i++){
          this.drawDoms[i].parentNode.removeChild(this.drawDoms[i]);
        }
      },    
    },
    mounted(){
      this.initMap();
      this.addDrawLayer();
    }
  }
</script>

<style >
  .map {
    background: rgba(0, 0, 0, 0);
  }
  .hidden {
    display: none;
  }
  .ol-tooltip {
    position: relative;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    color: white;
    padding: 4px 8px;
    opacity: 0.7;
    white-space: nowrap;
    font-size: 12px;
    cursor: default;
    user-select: none;
  }
  .ol-tooltip-measure {
    opacity: 1;
    font-weight: bold;
  }
  /* 测距结果贴图 */
  .ol-tooltip-static {
    background-color: #ffcc33;
    color: black;
    border: 1px solid white;
  }
  .ol-tooltip-measure:before,
  .ol-tooltip-static:before {
    border-top: 6px solid rgba(0, 0, 0, 0.5);
    border-right: 6px solid transparent;
    border-left: 6px solid transparent;
    content: "";
    position: absolute;
    bottom: -6px;
    margin-left: -7px;
    left: 50%;
  }
  .ol-tooltip-static:before {
    border-top-color: #ffcc33;
  }
  .ol-popup {
    position: absolute;
    background-color: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    padding: 15px;
    border-radius: 10px;
    border: 1px solid #cccccc;
    bottom: 12px;
    left: -50px;
    min-width: 280px;
  }
  .ol-popup:after, .ol-popup:before {
    top: 100%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }
  .ol-popup:after {
    border-top-color: white;
    border-width: 10px;
    left: 48px;
    margin-left: -10px;
  }
  .ol-popup:before {
    border-top-color: #cccccc;
    border-width: 11px;
    left: 48px;
    margin-left: -11px;
  }
  .ol-popup-closer {
    text-decoration: none;
    position: absolute;
    top: 2px;
    right: 8px;
  }
  .ol-popup-closer:after {
    content: "✖";
  }
</style>