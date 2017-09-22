(function($,window,undefined) {
	"use strict"

	//定义表格
		var Table = function() {

			//function $extend(des, src) { for(var p in src) { des[p] = src[p]; } return des; }

			//主类
			var tableCore = function(config){
				var self = this;
				if (!(self instanceof tableCore)) { //如果this没有值就不是构造函数，就new一个实例创建这个类始this有值
					return new tableCore(config);
				};
				self.config = $.extend(defaultConfig, config || {});//合并他俩，返回defaultConfig//访问对象有就是赋值，没有就是添加
			};

			//默认配置
			var defaultConfig = {
				//container:".tableBox",//容器元素，jquery
				url: "",
				iframe_url: "",
				callback: "",
				json_str_th: "",//表格头部内容json数据串
				json_str_td: "",//表格主体内容json数据串
				do_hover: false,//是否鼠标悬浮变换背景颜色效果
				do_hover_color: "#41c5b1",//鼠标悬浮变换背景颜色
				do_click: false,//是否可以点击行
				table_bgcolor: "#ffffff",//表格背景颜色
				thead_bgcolor: "#e5e5e5",//表格头部背景颜色
				tr_even_bgcolor: "",//表格主体奇数行背景颜色
				tr_odd_bgcolor: "#f9f9f9",//表格主体偶数行背景颜色
				params: {},
				template_th: "",
				template_td: "",
				namespace: ""
			};

			//主类原型
			tableCore.prototype = {
				constructor: tableCore,
				loadConfig: function(container, order, order_name, condition_add) { 
					//加载配置和一些默认的行为
					$(container+">table").css("background-color", this.config.table_bgcolor);
					$(container+">table>thead").css("background-color", this.config.thead_bgcolor);
					$(container+">table>tbody>tr:even").css("background-color", this.config.tr_even_bgcolor);
					$(container+">table>tbody>tr:odd").css("background-color", this.config.tr_odd_bgcolor);
					$(container+">table>thead>tr>th").each(function() {
						if($(this).data("sort")) {
							$(this).append("<i class=\"fa fa-sort"+($(this).data("sort")==order_name?"-"+order:"")+" mg\"></i>").css("cursor","pointer");
						}
					})
					//表头排序
					this.thSort(container, condition_add);
					//事件处理
					//行鼠标悬浮处理
					if(this.config.do_hover){
						eventHandler.doHover(container, this.config.do_hover_color);
					}
					//行点击处理
					if (this.config.do_click) {
						eventHandler.doClick(container, this.config);
					}
					//eventHandler.doSearch(this.config);
				},
				thSort: function(container, condition_add) { 
					var self = this;
					//表头点击排序
					$(container+">table>thead>tr>th").each(function(index, item) {
						$(this).click(function() { //每个头
							if ($(this).data("sort")) { //有数据
								var sort_i = $(this).find("i"); 
								var key = "json",
									params = {},
									param = [];
								$(".labelbox a").each(function(index, item) {
									//获取类型
									var type = $(this).data("type"),
										code = $(this).data("code");
									param.push({type:type, code:code});
								})

								if (param.length == 0) {
									param.push({type:"empty"});
								}

								if ($(".active3").data("id") == "2") {
									$(".tree_box1 ul li a").each(function() {
										if ($(this).find("i").eq(1).hasClass("fa-check-square-o")) {
											param.push({st_id: $(this).data("id")});
										}
									})

									if (param.length == 1) {
										param.push({st_id:"empty"});
									}

								} else {
									$(".tree_box ul li a").each(function() {
										if ($(this).find("i").eq(1).hasClass("fa-check-square-o")) {
											param.push({id:$(this).data("id")});
										}
									})

									if (param.length == 1) {
										param.push({id:"empty"});
									}
								}

								if (sort_i.hasClass("fa-sort")) {
									sort_i.removeClass("fa-sort").addClass("fa-sort-desc");
									param.push({name:$(this).data("sort"), order:"desc"});
								} else if (sort_i.hasClass("fa-sort-desc")) {
									sort_i.removeClass("fa-sort-desc").addClass("fa-sort-asc");
									param.push({name:$(this).data("sort"), order:"asc"});
								} else {
									sort_i.removeClass("fa-sort-asc").addClass("fa-sort-desc");
									param.push({name:$(this).data("sort"), order:"desc"});
								}
								var id = $(".active3").data("id");
								param.push({pageIndex:1, size:20});
								if (id === 79) {
									param.push({
												group:"protection_class",
												group_name:$(container).prev().find("a").html()
									});
									params[key] = JSON.stringify(param);
								}
								if (condition_add) {
									param.push({condition_add: condition_add});
								}
								params[key] = JSON.stringify(param);
								$(container).Table({
													url: self.config.url,
													callback: '',
													template_th: $("#table_tpl").val(),
													template_td: $("#table_tpl1").val(),
													params: params,
													do_hover: true/*是否鼠标悬浮变换背景颜色效果*/,
													do_click: true/*是否可以点击行*/
								});
							}
						})
					})
				},
				expand:function(){
					//展开

				},
				drag:function(){
					//拖拉

				}
			};


			//ajax类
			var ajaxHandler = {
				template: function(obj, template) { 
					String.prototype.table_temp = function caller(obj) {
						var hh = template.replace(/\%\w+\%/gi, function(matchs) {
					        var returns = obj[matchs.replace(/\%/g, "")];
					        return (returns + "") == "undefined"? "": (returns+"").replace(/kV/g,"");
					    });
					    return hh.replace(/并网电压等级/,"并网电压等级(kV)").replace(/机端额定电压\(\)/,"机端额定电压(kV)");	
					}
				},
				createTableBody: function (container, resp, table) {
					var self = this;
					var resp = resp.data;
		           	var page = resp[3];
		           	var pageIndex = page.pageIndex,	//当前页
						pageCount = page.pageCount,	//总页数
						totalCount = page.totalCount, //总条数
						PAGE_SIZE = 5,
						totalpage = Math.ceil(totalCount / PAGE_SIZE),
						json_data_td = resp[1].data;
					var newlist = json_data_td.slice(0, PAGE_SIZE);
					var trArr = [];
					console.log(newlist)


		        },
				getAjax: function(container, table) {
					var self = this;
					//发送ajax
					$.ajax({ 
						type: "post",
						dataType: "json",
						timeout: 100000,
						url: table.config.url,
						data: table.config.params,
						beforeSend: function() { //在发送请求之前调用，并且传入一个XMLHttpRequest作为参数。
							$(".data_info>.loading").show().html("正在加载...");
						},
						success: function(resp) { //成功
							self.callback(container,resp,table);
						},
						error: function() { //错误
							$(".data_info .loading").show().html("加载失败！<a href=\"javascript:;\">重试</a>").find("a").click(function(){
								$("#tableBox").Table({
													url: table.config.url,
													callback: '',
													namespace: table.config.namespace,
													template_th: $("#table_tpl").val(),
													template_td: $("#table_tpl1").val(),
													params: table.config.params,
													do_hover: true/*是否鼠标悬浮变换背景颜色效果*/,
													do_click: true/*是否可以点击行*/
								});
							});
						},
						// complete:function(){ //当请求完成之后调用这个函数，无论成功或失败。传入XMLHttpRequest对象，以及一个包含成功或错误代码的字符串。 
						// 	$(".data_info>.loading").fadeOut(300);
						// }
					})
				},
				parseJson: function(json_str) {
					//解析json
					return $.parseJSON(json_str);//接受json字符串，返回对象
				},
				joint: function(json_data, html, newHtml) { //拼接
					var htmlArr = [],
						self = this;
					if (json_data.length == undefined) {
						self.template(json_data, html);
						htmlArr.push(html.table_temp(json_data));
					} else {
						if (json_data.length.length != undefined) {
							self.template(json_data, html);
							htmlArr.push(html.table_temp(json_data));
						} else {
							json_data.forEach(function(object) {
								self.template(object, html);
								htmlArr.push(html.table_temp(object));
							});
						}
					}
					newHtml = htmlArr.join("");
					return newHtml;
				},
				//是否在数组中存在
				isExistInArr: function(value, array) {
					var isExist = false;
					for(var i in array) {
						if (array[i] == value) {
							isExist = true;
							break;
						}
					}
					return isExist;
				},
				callback: function(container, resp, table) {  	//元素 , 数据 , 实例
					var self = this;
					var resp = resp.data; //拿到数据
					var json_data_th,
						json_data_td,
						html_th = table.config.template_th, //得到默认的值
						html_td = table.config.template_td, //得到默认的值都为空的字符串
						newHtml_th = "",
						newHtml_td = "";
					var html_th = [],
						html_td = [],
						property = resp[2],
						page = resp[3],
						html_option = [],
						newHtml_option = "";
					var pageIndex = page.pageIndex,	//当前页
						pageCount = page.pageCount,	//总页数
						totalCount = page.totalCount, //总条数
						pageHtml = "",
						PAGE_SIZE = 5,
						totalpage = Math.ceil(totalCount / PAGE_SIZE);

					json_data_th = resp[0];
					json_data_td = resp[1].data;
					var newlist = json_data_td.slice(0, PAGE_SIZE);
					var trArr = [];

					$.each(newlist, function(i, obj) { 
						console.log(newlist)
			            trArr.push('<tr>'+'<td>' + obj.NAME + '</td>'+'<td>' + obj.ST_ID_0 + '</td>'+'<td>' + obj.VOLTAGE_TYPE_0 + '</td>'+'<td>' + obj.CONNECTIVE_PG_ID_0  + '</td>'+'<td>' + obj.DISPATCH_ORG_ID_0  + '</td>'+'<td>' + obj.MODEL_0  + '</td>'+'<td>' + obj.RUNNING_STATE_0  + '</td>'+'</tr>')
			        });
					

					for (var i = 0, j = property.count; i < j; i++) { //渲染列
						
						html_th.push("<th "+(i==0?"style=\"display:none\" ":"")+(self.isExistInArr(property["property_"+i],json_data_th.sort_names)?" data-sort=\""+property["property_"+i]+"\"":"")+">%"+property["property_"+i]+"%</th>");
						// html_td.push("<td "+(i==0?"style=\"display:none\" ":"")+"data-hidden=\"%"+property["property_"+i].toUpperCase()+"%\">%"+property["property_"+i].toUpperCase()+"_0%</td>");
					}

					html_th.join("");
					trArr.join("");
					$("#table_tpl").val("<thead data-table=\""+json_data_th.table_name_eng+"\"><tr>"+html_th+"</tr></thead>");
					$("#table_tpl1").val(trArr);
        			// $userTable.find('tbody').html(trArr.join(''));//上面得到的是一个数组

					newHtml_th = this.joint(json_data_th, $("#table_tpl").val(), newHtml_th);
					newHtml_td = this.joint(json_data_td, $("#table_tpl1").val(), newHtml_td);
					//插入页面	
					$(container+">table").empty().append(newHtml_th).append("<tbody>"+newHtml_td+"</tbody>");
					//去掉加载条
					$(".data_info>.loading").fadeOut(300);
					//加载默认配置
					table.loadConfig(
									container,  
									json_data_th.order, 
									json_data_th.order_name, 
									json_data_th.condition_add
					);
					
					if (pageIndex != 1) {
						pageHtml += "<li><a class=\"prev\" href=\"javascript:;\">上一页</a></li>";
					}

					/*for (var i = pageIndex - 5 > 0 ? pageIndex - 5 : 1, j = pageIndex + 5 > pageCount ? pageCount : pageIndex + 5; i <= j; i ++) {
						
						if (i != pageIndex) {
							pageHtml += "<li><a class=\"num\" href=\"javascript:;\">" + i + "</a></li>";
						} else {
							pageHtml += "<li><span style=\"border:0\">" + i + "</span></li>";
						}
					}*/

					for (var i=1; i<=totalpage; i++) {
						if (i != pageIndex) {
							pageHtml += "<li><a class=\"num\" href=\"javascript:;\">" + i + "</a></li>";
						} else {
							pageHtml += "<li><span style=\"border:0\">" + i + "</span></li>";
						}
					}

					if (pageIndex != pageCount) {
						pageHtml += "<li><a class=\"next\" href=\"javascript:;\">下一页</a></li>";
					}

					pageHtml += "<div class=\"layui-form-label-ju fl mr\">到第</div>";
					pageHtml += "<div class=\"jump-input-ju fl mr\"><input type=\"number\" name=\"number\" class=\"layui-input-ju\" min=\"1\" max=\"\"/></div>"
					pageHtml += "<div class=\"layui-form-label-ju fl mr\">页</div>";
					pageHtml += "<button id=\"save\" class=\"layui-btn\">确定</button>";

					pageHtml += "<li><span>共" + totalCount + "条记录 " + pageCount + "页</span></li>";

					$(container + " .pagination").empty().append(pageHtml);
					$(container + " .prev").on("click", function() {
						var params = {},
							param = [];
						var test_json_str = '{"data":[{"connective_pg_id":"接入电网","voltage_type":"电压等级","id":"设备ID","model":"型号","sort_names":["id","name","st_id","voltage_type","connective_pg_id","dispatch_org_id","running_state"],"name":"设备名称","property_name_eng":"running_state","dispatch_org_id":"调度机构","st_id":"所属厂站","table_name_eng":"SG_DEV_BUSBAR_B_NEW","running_state":"运行状态"},{"group_name":"","data":[{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901010001","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000001","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"长治站","ID_0":"130199010100000001"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010008","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000014","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"锡盟","ID_0":"130199010100000014"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010008","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000015","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"锡盟","ID_0":"130199010100000015"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000036","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"JLHN58K-1600","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000237","MODEL_0":"JLHN58K-1600","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"南阳站","ID_0":"130199010000000237"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000036","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"JLHN58K-1600","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000238","MODEL_0":"JLHN58K-1600","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"南阳站","ID_0":"130199010000000238"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000035","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"6063G-T6-D250/D230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000245","MODEL_0":"6063G-T6-D250/D230","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"荆门站","ID_0":"130199010000000245"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000035","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"6063G-T6-D250/D230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000246","MODEL_0":"6063G-T6-D250/D230","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"荆门站","ID_0":"130199010000000246"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000034","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000247","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"长治站","ID_0":"130199010000000247"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000034","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000248","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"长治站","ID_0":"130199010000000248"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01121200000005","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101120000","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000026","MODEL_0":"MWG5-1100/8000-63","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"天津","ST_ID_0":"海河","ID_0":"130199010100000026"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01121200000005","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101120000","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000025","MODEL_0":"MWG5-1100/8000-63","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"天津","ST_ID_0":"海河","ID_0":"130199010100000025"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901010001","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000005","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"长治站","ID_0":"130199010100000005"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010007","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"GIS","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130137010000000001","MODEL_0":"GIS","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"泉城","ID_0":"130137010000000001"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010007","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"GIS","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130137010000000010","MODEL_0":"GIS","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"泉城","ID_0":"130137010000000010"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010009","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130113060000000001","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"保定","ID_0":"130113060000000001"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010009","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130113060000000002","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"保定","ID_0":"130113060000000002"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01119901020026","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000196","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"平圩厂","ID_0":"130199010200000196"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01119901020026","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000198","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"平圩厂","ID_0":"130199010200000198"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020021","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF15-1100","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000258","MODEL_0":"ZF15-1100","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"安吉","ID_0":"130199010200000258"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020021","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF15-1100","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000259","MODEL_0":"ZF15-1100","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"安吉","ID_0":"130199010200000259"}]},{"count":8,"property_1":"name","property_0":"id","property_3":"voltage_type","property_2":"st_id","property_5":"dispatch_org_id","property_4":"connective_pg_id","property_7":"running_state","property_6":"model"},{"pageCount":2,"totalCount":38,"pageIndex":1}],"respCode":200,"respDesc":"获取成功"}';
						$(container).Table({
											url:table.config.url,
											json_str:test_json_str,
											callback:'',
											namespace:table.config.namespace,
											template_th:$("#table_tpl").val(),
											template_td:$("#table_tpl1").val(),
											params:params,do_hover:true/*是否鼠标悬浮变换背景颜色效果*/,
											do_click:true/*是否可以点击行*/
						});
					})

					$(container + " .next").on("click", function() {
						var params = {},
							param = [];
						var test_json_str = '{"data":[{"connective_pg_id":"接入电网","voltage_type":"电压等级","id":"设备ID","model":"型号","sort_names":["id","name","st_id","voltage_type","connective_pg_id","dispatch_org_id","running_state"],"name":"设备名称","property_name_eng":"running_state","dispatch_org_id":"调度机构","st_id":"所属厂站","table_name_eng":"SG_DEV_BUSBAR_B_NEW","running_state":"运行状态"},{"group_name":"","data":[{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020025","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000264","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"练塘","ID_0":"130199010200000264"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020025","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000267","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"练塘","ID_0":"130199010200000267"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020020","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000276","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"东吴","ID_0":"130199010200000276"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020020","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000277","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"东吴","ID_0":"130199010200000277"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020017","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"NYZ-1600K","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000288","MODEL_0":"NYZ-1600K","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"盱眙","ID_0":"130199010200000288"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020019","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000290","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"芜湖","ID_0":"130199010200000290"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020019","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000292","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"芜湖","ID_0":"130199010200000292"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020024","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000302","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"莲都","ID_0":"130199010200000302"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020024","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000303","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"莲都","ID_0":"130199010200000303"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020018","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000305","MODEL_0":"ZF27-1100(L)","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"兰江","ID_0":"130199010200000305"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020016","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000306","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"泰州","ID_0":"130199010200000306"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020018","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000308","MODEL_0":"ZF27-1100(L)","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"兰江","ID_0":"130199010200000308"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020016","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000312","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"泰州","ID_0":"130199010200000312"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020023","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000318","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"淮南","ID_0":"130199010200000318"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020023","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000319","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"淮南","ID_0":"130199010200000319"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020022","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000326","MODEL_0":"ZF27-1100(L)","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"榕城","ID_0":"130199010200000326"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020022","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000327","MODEL_0":"ZF27-1100(L)","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"榕城","ID_0":"130199010200000327"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020017","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"NYZ-1600K","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000328","MODEL_0":"NYZ-1600K","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"盱眙","ID_0":"130199010200000328"}]},{"count":8,"property_1":"name","property_0":"id","property_3":"voltage_type","property_2":"st_id","property_5":"dispatch_org_id","property_4":"connective_pg_id","property_7":"running_state","property_6":"model"},{"pageCount":2,"totalCount":38,"pageIndex":2}],"respCode":200,"respDesc":"获取成功"}';
						$(container).Table({
											url: table.config.url,
											json_str: test_json_str,
											callback: '',
											namespace: table.config.namespace,
											template_th: $("#table_tpl").val(),
											template_td: $("#table_tpl1").val(),
											params: params,
											do_hover: true/*是否鼠标悬浮变换背景颜色效果*/,
											do_click: true/*是否可以点击行*/
						});
					})
					$(container+" .num").on("click", function() {
						var params = {},
							param = [];
						var pageIndex = parseInt($(this).html()); //当前第几页
						var test_json_str_array = [];
						
						test_json_str_array[0] = '{"data":[{"connective_pg_id":"接入电网","voltage_type":"电压等级","id":"设备ID","model":"型号","sort_names":["id","name","st_id","voltage_type","connective_pg_id","dispatch_org_id","running_state"],"name":"设备名称","property_name_eng":"running_state","dispatch_org_id":"调度机构","st_id":"所属厂站","table_name_eng":"SG_DEV_BUSBAR_B_NEW","running_state":"运行状态"},{"group_name":"","data":[{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901010001","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000001","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"长治站","ID_0":"130199010100000001"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010008","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000014","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"锡盟","ID_0":"130199010100000014"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010008","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000015","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"锡盟","ID_0":"130199010100000015"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000036","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"JLHN58K-1600","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000237","MODEL_0":"JLHN58K-1600","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"南阳站","ID_0":"130199010000000237"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000036","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"JLHN58K-1600","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000238","MODEL_0":"JLHN58K-1600","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"南阳站","ID_0":"130199010000000238"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000035","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"6063G-T6-D250/D230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000245","MODEL_0":"6063G-T6-D250/D230","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"荆门站","ID_0":"130199010000000245"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000035","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"6063G-T6-D250/D230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000246","MODEL_0":"6063G-T6-D250/D230","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"荆门站","ID_0":"130199010000000246"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000034","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000247","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"长治站","ID_0":"130199010000000247"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000034","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000248","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"长治站","ID_0":"130199010000000248"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01121200000005","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101120000","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000026","MODEL_0":"MWG5-1100/8000-63","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"天津","ST_ID_0":"海河","ID_0":"130199010100000026"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01121200000005","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101120000","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000025","MODEL_0":"MWG5-1100/8000-63","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"天津","ST_ID_0":"海河","ID_0":"130199010100000025"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901010001","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000005","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"长治站","ID_0":"130199010100000005"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010007","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"GIS","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130137010000000001","MODEL_0":"GIS","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"泉城","ID_0":"130137010000000001"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010007","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"GIS","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130137010000000010","MODEL_0":"GIS","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"泉城","ID_0":"130137010000000010"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010009","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130113060000000001","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"保定","ID_0":"130113060000000001"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010009","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130113060000000002","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"保定","ID_0":"130113060000000002"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01119901020026","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000196","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"平圩厂","ID_0":"130199010200000196"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01119901020026","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000198","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"平圩厂","ID_0":"130199010200000198"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020021","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF15-1100","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000258","MODEL_0":"ZF15-1100","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"安吉","ID_0":"130199010200000258"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020021","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF15-1100","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000259","MODEL_0":"ZF15-1100","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"安吉","ID_0":"130199010200000259"}]},{"count":8,"property_1":"name","property_0":"id","property_3":"voltage_type","property_2":"st_id","property_5":"dispatch_org_id","property_4":"connective_pg_id","property_7":"running_state","property_6":"model"},{"pageCount":2,"totalCount":38,"pageIndex":1}],"respCode":200,"respDesc":"获取成功"}';
						test_json_str_array[1] = '{"data":[{"connective_pg_id":"接入电网","voltage_type":"电压等级","id":"设备ID","model":"型号","sort_names":["id","name","st_id","voltage_type","connective_pg_id","dispatch_org_id","running_state"],"name":"设备名称","property_name_eng":"running_state","dispatch_org_id":"调度机构","st_id":"所属厂站","table_name_eng":"SG_DEV_BUSBAR_B_NEW","running_state":"运行状态"},{"group_name":"","data":[{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020025","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000264","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"练塘","ID_0":"130199010200000264"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020025","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000267","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"练塘","ID_0":"130199010200000267"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020020","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000276","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"东吴","ID_0":"130199010200000276"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020020","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000277","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"东吴","ID_0":"130199010200000277"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020017","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"NYZ-1600K","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000288","MODEL_0":"NYZ-1600K","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"盱眙","ID_0":"130199010200000288"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020019","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000290","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"芜湖","ID_0":"130199010200000290"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020019","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000292","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"芜湖","ID_0":"130199010200000292"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020024","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000302","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"莲都","ID_0":"130199010200000302"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020024","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000303","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"莲都","ID_0":"130199010200000303"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020018","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000305","MODEL_0":"ZF27-1100(L)","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"兰江","ID_0":"130199010200000305"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020016","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000306","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"泰州","ID_0":"130199010200000306"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020018","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000308","MODEL_0":"ZF27-1100(L)","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"兰江","ID_0":"130199010200000308"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020016","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000312","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"泰州","ID_0":"130199010200000312"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020023","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000318","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"淮南","ID_0":"130199010200000318"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020023","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000319","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"淮南","ID_0":"130199010200000319"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020022","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000326","MODEL_0":"ZF27-1100(L)","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"榕城","ID_0":"130199010200000326"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020022","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000327","MODEL_0":"ZF27-1100(L)","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"榕城","ID_0":"130199010200000327"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020017","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"NYZ-1600K","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000328","MODEL_0":"NYZ-1600K","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"盱眙","ID_0":"130199010200000328"}]},{"count":8,"property_1":"name","property_0":"id","property_3":"voltage_type","property_2":"st_id","property_5":"dispatch_org_id","property_4":"connective_pg_id","property_7":"running_state","property_6":"model"},{"pageCount":2,"totalCount":38,"pageIndex":2}],"respCode":200,"respDesc":"获取成功"}';
						
						var test_json_str = test_json_str_array[pageIndex-1];	//一页一条数据，拿到当前页的数据

						$(container).Table({
											url: table.config.url,
											json_str: test_json_str,
											callback: '',
											namespace: table.config.namespace,
											template_th: $("#table_tpl").val(),
											template_td: $("#table_tpl1").val(),
											params: params,
											do_hover: true/*是否鼠标悬浮变换背景颜色效果*/,
											do_click: true/*是否可以点击行*/
						});
					})

		            $(container).delegate('#save', "click", function() { 
		            	var val = $(container).find('.pagination .layui-input-ju').val();
		            	var test_json_str_array = [];
						
						test_json_str_array[0] = '{"data":[{"connective_pg_id":"接入电网","voltage_type":"电压等级","id":"设备ID","model":"型号","sort_names":["id","name","st_id","voltage_type","connective_pg_id","dispatch_org_id","running_state"],"name":"设备名称","property_name_eng":"running_state","dispatch_org_id":"调度机构","st_id":"所属厂站","table_name_eng":"SG_DEV_BUSBAR_B_NEW","running_state":"运行状态"},{"group_name":"","data":[{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901010001","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000001","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"长治站","ID_0":"130199010100000001"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010008","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000014","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"锡盟","ID_0":"130199010100000014"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010008","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000015","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"锡盟","ID_0":"130199010100000015"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000036","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"JLHN58K-1600","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000237","MODEL_0":"JLHN58K-1600","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"南阳站","ID_0":"130199010000000237"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000036","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"JLHN58K-1600","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000238","MODEL_0":"JLHN58K-1600","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"南阳站","ID_0":"130199010000000238"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000035","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"6063G-T6-D250/D230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000245","MODEL_0":"6063G-T6-D250/D230","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"荆门站","ID_0":"130199010000000245"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000035","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"6063G-T6-D250/D230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000246","MODEL_0":"6063G-T6-D250/D230","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"荆门站","ID_0":"130199010000000246"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000034","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000247","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"长治站","ID_0":"130199010000000247"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901000034","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990100","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010000000248","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"国网","ST_ID_0":"长治站","ID_0":"130199010000000248"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01121200000005","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101120000","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000026","MODEL_0":"MWG5-1100/8000-63","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"天津","ST_ID_0":"海河","ID_0":"130199010100000026"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01121200000005","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101120000","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000025","MODEL_0":"MWG5-1100/8000-63","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"天津","ST_ID_0":"海河","ID_0":"130199010100000025"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"国调","VOLTAGE_TYPE":1001,"ST_ID":"01129901010001","DISPATCH_ORG_ID":"0021990100","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010100000005","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"长治站","ID_0":"130199010100000005"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010007","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"GIS","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130137010000000001","MODEL_0":"GIS","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"泉城","ID_0":"130137010000000001"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010007","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"GIS","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130137010000000010","MODEL_0":"GIS","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"泉城","ID_0":"130137010000000010"},{"NAME":"1母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010009","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130113060000000001","MODEL_0":"ZF27-1100(L)","NAME_0":"1母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"保定","ID_0":"130113060000000001"},{"NAME":"2母线","DISPATCH_ORG_ID_0":"华北分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901010009","DISPATCH_ORG_ID":"0021990101","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990101","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130113060000000002","MODEL_0":"ZF27-1100(L)","NAME_0":"2母线","CONNECTIVE_PG_ID_0":"华北","ST_ID_0":"保定","ID_0":"130113060000000002"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01119901020026","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000196","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"平圩厂","ID_0":"130199010200000196"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01119901020026","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000198","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"平圩厂","ID_0":"130199010200000198"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020021","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF15-1100","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000258","MODEL_0":"ZF15-1100","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"安吉","ID_0":"130199010200000258"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020021","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF15-1100","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000259","MODEL_0":"ZF15-1100","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"安吉","ID_0":"130199010200000259"}]},{"count":8,"property_1":"name","property_0":"id","property_3":"voltage_type","property_2":"st_id","property_5":"dispatch_org_id","property_4":"connective_pg_id","property_7":"running_state","property_6":"model"},{"pageCount":2,"totalCount":38,"pageIndex":1}],"respCode":200,"respDesc":"获取成功"}';
						test_json_str_array[1] = '{"data":[{"connective_pg_id":"接入电网","voltage_type":"电压等级","id":"设备ID","model":"型号","sort_names":["id","name","st_id","voltage_type","connective_pg_id","dispatch_org_id","running_state"],"name":"设备名称","property_name_eng":"running_state","dispatch_org_id":"调度机构","st_id":"所属厂站","table_name_eng":"SG_DEV_BUSBAR_B_NEW","running_state":"运行状态"},{"group_name":"","data":[{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020025","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000264","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"练塘","ID_0":"130199010200000264"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020025","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000267","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"练塘","ID_0":"130199010200000267"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020020","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000276","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"东吴","ID_0":"130199010200000276"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020020","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000277","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"东吴","ID_0":"130199010200000277"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020017","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"NYZ-1600K","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000288","MODEL_0":"NYZ-1600K","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"盱眙","ID_0":"130199010200000288"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020019","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000290","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"芜湖","ID_0":"130199010200000290"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020019","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000292","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"芜湖","ID_0":"130199010200000292"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020024","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000302","MODEL_0":"LDRE-φ250/φ230","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"莲都","ID_0":"130199010200000302"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020024","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"LDRE-φ250/φ230","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000303","MODEL_0":"LDRE-φ250/φ230","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"莲都","ID_0":"130199010200000303"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020018","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000305","MODEL_0":"ZF27-1100(L)","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"兰江","ID_0":"130199010200000305"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020016","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000306","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"泰州","ID_0":"130199010200000306"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020018","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000308","MODEL_0":"ZF27-1100(L)","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"兰江","ID_0":"130199010200000308"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020016","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000312","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"泰州","ID_0":"130199010200000312"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020023","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000318","MODEL_0":"MWG5-1100/8000-63","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"淮南","ID_0":"130199010200000318"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020023","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"MWG5-1100/8000-63","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000319","MODEL_0":"MWG5-1100/8000-63","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"淮南","ID_0":"130199010200000319"},{"NAME":"II母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020022","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000326","MODEL_0":"ZF27-1100(L)","NAME_0":"II母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"榕城","ID_0":"130199010200000326"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020022","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"ZF27-1100(L)","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000327","MODEL_0":"ZF27-1100(L)","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"榕城","ID_0":"130199010200000327"},{"NAME":"I母线","DISPATCH_ORG_ID_0":"华东分中心","VOLTAGE_TYPE":1001,"ST_ID":"01129901020017","DISPATCH_ORG_ID":"0021990102","RUNNING_STATE":1003,"CONNECTIVE_PG_ID":"0101990102","MODEL":"NYZ-1600K","VOLTAGE_TYPE_0":"1000kV","RUNNING_STATE_0":"在运","ID":"130199010200000328","MODEL_0":"NYZ-1600K","NAME_0":"I母线","CONNECTIVE_PG_ID_0":"华东","ST_ID_0":"盱眙","ID_0":"130199010200000328"}]},{"count":8,"property_1":"name","property_0":"id","property_3":"voltage_type","property_2":"st_id","property_5":"dispatch_org_id","property_4":"connective_pg_id","property_7":"running_state","property_6":"model"},{"pageCount":2,"totalCount":38,"pageIndex":2}],"respCode":200,"respDesc":"获取成功"}';
						
						var test_json_str = test_json_str_array[val-1];	//一页一条数据，拿到当前页的数据

		            	if (!isNaN(val)) { //是数字的话
		            				console.log(val)
			                    if (val <= pageCount) { //小于总页数
			                    	//刷新页面
			                    	$(container).Table({
											json_str: test_json_str,
											namespace: table.config.namespace,
											template_th: $("#table_tpl").val(),
											template_td: $("#table_tpl1").val(),
											do_hover: true/*是否鼠标悬浮变换背景颜色效果*/,
											do_click: true/*是否可以点击行*/
									});

			                    } else {
			                    	alert("超出页总数");
			                    }

		                } else {
		                	alert("请输入数字");
		                }
		            })

				}
			};

			//事件类
			var eventHandler = {
				doHover: function(container, do_hover_color) {
					//鼠标悬浮
					var org_color;
					$(container+">table>tbody>tr").mouseover(function() {
						org_color = $(this).css("background-color"); 
						$(this).css("background-color", do_hover_color);
					});
					$(container+">table>tbody>tr").mouseout(function() {
						$(this).css("background-color", org_color);
					});
				},
				doClick: function(container, config) { 
					//点击行
					$(container+">table>tbody>tr").hover(function() {
						$(this).css("cursor", "pointer");
					}).dblclick(function() { 
						var table_name = $(this).parent().prev().data("table");
						/*var url1=config.url.substring(0,config.url.indexOf("action=")+7)
								  +"getInfoByParam&"+config.namespace+"param="+$(this).find("td").eq(0).data("hidden")
								  +"&"+config.namespace+"tableName="+table_name;*/
						//url1 = "http://192.168.9.33:28080/model-query-service/dev/getDevGenerator?devGeneratorId=110199010400000055";
							
						//console.log("url1:" + url1);
						//$("body").Popup({title:"发电机信息",url:url1,callback:'',namespace:config.namespace,json_str:test_json_str,do_drag:false/*是否可拖动*/,do_resize:true/*是否可改变大小*/,do_close_destroy:true/*是否关闭销毁*/});
						//$("body").Popup({title:$(this).find("td").eq(1).html()+"详情",url:url1,callback:'',namespace:config.namespace,json_str:test_json_str,do_drag:false/*是否可拖动*/,do_resize:true/*是否可改变大小*/,do_close_destroy:true/*是否关闭销毁*/});
						//		  +"&"+config.namespace+"tableName="+table_name;
						//url1 = "http://192.168.6.208:8081/model-query-service/dev/getDevGenerator?devGeneratorId=110199010400000055";
						var id = $(".active3").data("id"),title = $(".active3").html();
						//if(id===51){
							//var url1 = "http://192.168.9.33:28080/model-query-service/dev/getDevGenerator?devGeneratorId=110199010400000055";
							//$("body").Popup({title:"发电机信息",url:url1,callback:'',namespace:config.namespace,json_str:test_json_str,do_drag:true/*是否可拖动*/,do_resize:true/*是否可改变大小*/,do_close_destroy:true/*是否关闭销毁*/});
						//	var url=config.url.substring(0,config.url.indexOf("action=")+7).replace("exclusive","pop_up")+"toSubstationDetail&"+config.namespace+"id="+$(this).find("td").eq(0).data("hidden");
						//	showPopup(url);
						//}else{
						//	var url1=config.url.substring(0,config.url.indexOf("action=")+7)
						//	  +"getInfoByParam&"+config.namespace+"param="+$(this).find("td").eq(0).data("hidden")
						//	  +"&"+config.namespace+"tableName="+table_name;
						//	$("body").Popup({title:$(this).find("td").eq(1).html()+"详情",url:url1,callback:'',namespace:config.namespace,json_str:test_json_str,do_drag:false/*是否可拖动*/,do_resize:true/*是否可改变大小*/,do_close_destroy:true/*是否关闭销毁*/});
						//}
						//var url=config.url.substring(0,config.url.indexOf("action=")+7).replace("exclusive","pop_up")+"toSubstationDetail&"+config.namespace+"id="+id+"&"+config.namespace+"detailId="+$(this).find("td").eq(0).data("hidden");	
						var url = config.iframe_url + "&"+config.namespace + "id=" + id
							   +"&" + config.namespace + "detailId=" + $(this).find("td").eq(0).data("hidden")
							   +"&"+config.namespace+"tableName="+table_name;

						showPopup(title, url);
						
						$(".yui3-widget-mask").on("click",function(){
							$(".close").trigger("click");
						})
						
						//console.log("url1:" + url1);
						//$("body").Popup({title:$(this).find("td").eq(1).html()+"详情",url:url1,callback:'',namespace:config.namespace,json_str:test_json_str,do_drag:false/*是否可拖动*/,do_resize:true/*是否可改变大小*/,do_close_destroy:true/*是否关闭销毁*/});
						//window.location.href=$(this).attr("data_click_url");
					})
				},
				doSearch: function(config) {
					$(".condition_add .search_pick_input").bind({
						input:function(){

							if($(this).prop("comStart")) {
								return;//中文输入过程中不截断
							}
							var params = {}, 
								param = [];
							$(".labelbox a").each(function() {
								//获取类型
								var type = $(this).data("type"),
									code = $(this).data("code");
								param.push({type: type, code: code});
							});

							if (param.length == 0) {
								param.push({type:"empty"});
							}

							if ($(".active3").data("id") == "53") {
								$(".tree_box1 ul li a").each(function() {
									if($(this).find("i").eq(0).hasClass("fa-check-square-o")) {
										param.push({st_id:$(this).data("id")});
									}
								})
								if (param.length == 1) {
									param.push({st_id:"empty"});
								}
							} else {
								$(".tree_box ul li a").each(function() {
									if($(this).find("i").eq(1).hasClass("fa-check-square-o")) {
										param.push({id:$(this).data("id")});
									}
								})
								if (param.length == 1) {
									param.push({id:"empty"});
								}
							}
							param.push({pageIndex:1,size:20});
							param.push({condition_add:$(this).val()});
							params[key] = JSON.stringify(param);
							$("#tableBox").Table({
												url:config.url,
												callback:'',
												namespace:config.namespace,
												template_th:$("#table_tpl").val(),
												template_td:$("#table_tpl1").val(),
							    				params:params,do_hover:true/*是否鼠标悬浮变换背景颜色效果*/,
												do_click:true/*是否可以点击行*/
							});
							return false;
						}
					})
				}
			};
			return {
				init: function(container, config) {//操作的元素，将要使用的参数 

					//window.onload=function(){
						var table = tableCore(config); //初始化
						var json_str = ajaxHandler.parseJson(table.config.json_str); //请求数据

						if (json_str && json_str.data) { //如果数据回来
							ajaxHandler.callback(container, json_str, table);//回调函数  数据渲染都在这个地方
							ajaxHandler.createTableBody(container, json_str, table);
							return;
						}

						ajaxHandler.getAjax(container, table); //调用ajax封装 //页面渲染

						/*var json_str_th=table.config.json_str_th,json_str_td=table.config.json_str_td;
						var json_data_th,json_data_td,html_th=$("#table_tpl").val(),html_td=$("#table_tpl1").val(),newHtml_th="",newHtml_td="";
						json_data_th=ajaxHandler.parseJson(json_str_th);
						json_data_td=ajaxHandler.parseJson(json_str_td);
						newHtml_th=ajaxHandler.joint(json_data_th,html_th,newHtml_th);
						newHtml_td=ajaxHandler.joint(json_data_td,html_td,newHtml_td);
						//插入页面	
						$(container+">table").append(newHtml_th).append("<tbody>"+newHtml_td+"</tbody>");
						//加载默认配置
						table.loadConfig(container);*/
					//}
				}
			}
		}();

		$.fn.Table = function(config) { //调用组件入口,传入一个对象将要使用的参数
			Table.init(this.selector, config); //元素，数据
		}
		
})(jQuery,window);