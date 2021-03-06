(function($,window,undefined){
	"use strict"
	//定义树
		var Tree = function() {
			//function $extend(des, src) { for(var p in src) { des[p] = src[p]; } return des; }
			//forEach兼容检测
			if (!Array.prototype.forEach) {  
				Array.prototype.forEach = function(fun /*, thisp*/) {  
					var len = this.length;  
					if (typeof fun != "function")  
						throw new TypeError();  
					var thisp = arguments[1];  
					for (var i = 0; i < len; i++) {  
						if (i in this)  
							fun.call(thisp, this[i], i, this);  
					}  
				};  
			}

			//主类
			var treeCore = function(config){
				var self = this;
				if(!(self instanceof treeCore)) {
					return new treeCore(config);
				}
				self.config = $.extend(defaultConfig, config || {});
			};
			//默认配置
			var defaultConfig = {
				url:"",
				click_url:"",
				template:$("#tree_tpl").val(),
				callback:"",
				json_str:"",
				namespace:"",
				param:{},
				table_url:"",
				type:"",
				condition_url:""
			};

			//主类原型
			treeCore.prototype = {
				constructor:treeCore,
				
				expand:function(){
					//展开

				},
				drag:function(){
					//拖拉

				}
			};
			//ajax类
			var xmlHttp;
			var ajax={
				//模板解析
				template:function(obj,template){
					String.prototype.tree_temp=function caller(obj) {
						var hh=template.replace(/\%\w+\%/gi, function(matchs) {
					        var returns = obj[matchs.replace(/\%/g, "")];
					        return (returns + "") == "undefined"? "": returns;
					    });
					    //var aa=arguments;
					    if(obj.childMenuList){
					    	var bb="";
					    	obj.childMenuList.forEach(function(object) {
								//bb += aa.callee(object);
								bb += caller(object);
							});
							return hh.replace(/<\/li>/gi,"<ul>"+bb+"</ul></li>");
					    }else if(obj.data){
					    	var bb="";
					    	obj.data.forEach(function(object) {
								//bb += aa.callee(object);
								bb += caller(object);
							});
					    	return hh.replace(hh.substring(0,hh.indexOf("</li>")),"<li data-id="+obj.name+">"+obj.data[0].CONNECTIVE_PG_ID_0+"：").replace(/<\/li>/gi,"<ul><li>"+bb+"</li></ul></li>");
					    }
						return hh;	
					}
				},
				getAjax:function(container,config){
					//var result;
					var self=this;
					//发生ajax
					$.ajax({
						type:"post",
						dataType:"json",
						timeout:100000,
						//url:config.url,
						url:config.url,
						data:config.params,
						beforeSend:function(){
							$(".container_left .loading").show().html("正在加载...");
						},
						success:function(resp){
							self.callback(container,resp,config);
						},
						error:function(){
							$(".container_left .loading").show().html("加载失败！<a href=\"javascript:;\">重试</a>").find("a").click(function(){
								$(container).Tree({url:config.url,click_url:config.click_url,table_url:config.table_url,callback:'',template:$("#tree_tpl").val(),namespace:config.namespace});
							});
						},
						/*complete:function(){
							$(".container_left .loading").fadeOut(300);
						}*/
					})
					//return result;
				},
				parseJson:function(json_str){
					//解析json
					return $.parseJSON(json_str);
				},
				joint:function(json_data,html,newHtml){
					//拼接
					var htmlArr=[],self=this;
					json_data.forEach(function(object) {
						self.template(object,html);
						htmlArr.push(html.tree_temp(object));
					});
					newHtml=htmlArr.join("");
					return newHtml;
				},
				callback:function(container,resp,config){
					var json_data,html=config.template,newHtml="";
					//json_data=ajax.parseJson(json_str);
					json_data=resp.data;
					if(config.type=="org"){
						newHtml=this.joint(json_data.org,html,newHtml);
					}
					//插入页面	
					$(container+">ul").empty().append(newHtml);
					//去掉加载条
					$(".loading").fadeOut(300);
					eventHandler.doExpand(container,config);
					eventHandler.doClick(container,config,resp);
					eventHandler.doSearch(container,config);
					$(container+">ul>li>a>i:nth-child(1)").each(function(){
						$(this).trigger("click");
					});
				}
			};
			//事件类
			var eventHandler={
				doExpand:function(container,config){
					$(container+" ul li a").each(function(){
						$(this).find("i").eq(0).click(function(){
							if($(this).hasClass("fa-square-o")||$(this).hasClass("fa-check-square-o")){
								//二级没用+-号的，是复选框
								if($(this).hasClass("fa-square-o")){
									$(this).removeClass("fa-square-o").addClass("fa-check-square-o");
								}else{
									$(this).removeClass("fa-check-square-o").addClass("fa-square-o");
								}
							}else{
								//一级有+-号的，是+-号
								if($(this).hasClass("fa-plus")){
									$(this).parent().next("ul").slideDown(500);
									$(this).removeClass("fa-plus").addClass("fa-minus");
									return;
								}
								$(this).parent().next("ul").slideUp(500);
								$(this).removeClass("fa-minus").addClass("fa-plus");
							}
						})
					});
				},
				doClick:function(container,config,resp){
					var self=this;
					$(container+" ul li a").each(function(){
						var that=$(this),$i=$(this).find("i").eq(1);
						that.find("i").eq(1).on("click",{that:that,container:container,config:config,$i:$i,radio:false,result:false},self.doCheck);
						that.find("span").on("click",{that:that,container:container,config:config,$i:$i,radio:false,result:false},self.doCheck);
					})
					//$("#all,#directly").on("change",{that:that,container:container,config:config,$i:$i},self.doCheck);
					$("input[name='range']").bind("click",function(){
						$(container+" ul li a").each(function(){
							var that=$(this),$i=$(this).find("i").eq(1),event;
							if(that.hasClass("active")){
								event={data:{that:that,container:container,config:config,$i:$i,radio:true}};
								self.doCheck(event);
							}
						})
					})
				},
				doCheck:function(event){
					var self=event.data.that,config=event.data.config,
						container=event.data.container,$i=event.data.$i,
						radio=event.data.radio,result=event.data.result,
						eventThis=event.data.eventThis;
					var id=self.data("id"),url=config.click_url,key="json",params={},param=[];
					//param.push({id:id});
					$(container+" ul li a").removeClass("active");
					self.addClass("active");
					if($i.hasClass("fa-square-o")){
						//没有选中-》变为选中
						if(!radio){
							//非单选点击
							if($("#all").is(":checked")){
								$i.removeClass("fa-square-o").addClass("fa-check-square-o").parent().next("ul").find(".fa-square-o").removeClass("fa-square-o").addClass("fa-check-square-o");
							}else{
								$i.removeClass("fa-square-o").addClass("fa-check-square-o");
							}
						}
					}else{
						//选中-》不选中
						$(".tree_box1 ul li").each(function(){
							var that=$(this);
							self.next("ul").find("a").each(function(){
								if($(this).data("id")==that.data("id")){
									that.remove();
								}
							})
							if(that.data("id")==self.data("id")){
								that.remove();
							}
						})
						if(!radio){
							//非单选框或者单选框是直属
							$i.removeClass("fa-check-square-o").addClass("fa-square-o");
							//给子元素去掉选中
							$i.parent().next("ul").find(".fa-check-square-o").removeClass("fa-check-square-o").addClass("fa-square-o");
						}else{
							if($("#all").is(":checked")){
								//单选框并且是全部
								//给子元素添加选中
								$i.parent().next("ul").find(".fa-square-o").removeClass("fa-square-o").addClass("fa-check-square-o");
							}else{
								//给子元素去掉选中
								$i.parent().next("ul").find(".fa-check-square-o").removeClass("fa-check-square-o").addClass("fa-square-o");
							}
						}
					}
					
						if(result){
							var id=self.data("id"),spanTxt=self.find("span").eq(0).text();
							if(localStorage.getItem("search_history_ac-equipment") == null){
								localStorage.setItem("search_history_ac-equipment",id+"|"+spanTxt);
							}else{
								var search_history=localStorage.getItem("search_history_ac-equipment").split(",");
								if(!eventThis.isExistInArr(id+"|"+spanTxt,search_history)){
									localStorage.setItem("search_history_ac-equipment",localStorage.getItem("search_history_ac-equipment")+","+id+"|"+spanTxt);
								}
							}
						}
					//}
				},
				doSearch:function(container,config){
					var oldHtml="",self=this;
					$(".search_pick_input").bind({
						click:function(){
							if($(this).val().length==0){
								$(this).addClass("active").prev(".search_pick_text").hide().parent().css("z-index","2").animate({"width":"100%"},500).find(".search_close").show();
								$(this).parent().prev(".loading").show();
								self.setSearchHistory($(this));
								$(this).parent().next(".search_result").show();
								oldHtml=$(this).parent().next(".search_result").html();
							}
							$(".search_result ul li a").each(function(){
								var that=$(this),$i=$(this).find("i").eq(1);
								that.find("i").eq(1).on("click",{that:that,container:container,config:config,$i:$i,radio:false,result:true,eventThis:self},self.doCheck);
								that.find("span").on("click",{that:that,container:container,config:config,$i:$i,radio:false,result:true,eventThis:self},self.doCheck);
							})
						},
						compositionstart:function(){
							$(this).prop("comStart",true);
							//console.log("start");
						},
						compositionend:function(){
							$(this).prop("comStart",false);
							//console.log("end");
						}
					});
					$(".jigou .search_pick_input,.changzhan .search_pick_input").bind({
							input:function(){
								if($(this).prop("comStart")){
									return;//中文输入过程中不截断
								}
								var self1=$(this);
								self1.parent().next(".search_result").empty().append("<ul></ul>");
								if($(this).val().length==0){
									$(this).parent().next(".search_result").html(oldHtml);
									return;
								}
								if($(this).prev(".search_pick_text").text()=="搜索厂站"){
									$(this).parent().next().next().find("li").find("ul").find("li").each(function(){
										var spantext=$(this).find("span").text(),reg=new RegExp(self1.val(),"gim");
										if(spantext.indexOf(self1.val())>=0){
											self1.parent().next(".search_result").find("ul").append("<li>"+$(this).html().replace(reg,"<span style='color:#ff0000'>"+self1.val()+"</span>")+"</li>")
										}
									})
									return;
								}
								$(this).parent().next().next().next().find("ul").find("li").find("a").each(function(){
									$(this).find("span").each(function(){
										var that=$(this).parent();
										var spantext=$(this).text(),reg=new RegExp(self1.val(),"gim");
										if(spantext.indexOf(self1.val())>=0){
											self1.parent().next(".search_result").find("ul").append("<li><a href='javascript:;' data-id="+that.data("id")+">"+that.parent().find("a").eq(0).html().replace(reg,"<span style='color:#ff0000'>"+self1.val()+"</span>")+"</a></li>")
										}
									})
								})
								
								$(".search_result ul li a").each(function(){
									var that=$(this),$i=$(this).find("i").eq(1);
									that.find("i").eq(1).on("click",{that:that,container:container,config:config,$i:$i,radio:false,result:true,eventThis:self},self.doCheck);
									that.find("span").on("click",{that:that,container:container,config:config,$i:$i,radio:false,result:true,eventThis:self},self.doCheck);
								})
							}
						})
					
					$(".jigou .search_close").on("click",function(){
						if($(this).prev(".search_pick_input").val().length>0){
							$(this).prev(".search_pick_input").val("");
							self.setSearchHistory($(this));
						}else{
							$(this).prev(".search_pick_input").removeClass("active").prev(".search_pick_text").show().parent().css("z-index","0").animate({"width":"85px"},500).find(".search_close").hide();
							$(this).parent().prev(".loading").hide();
							$(this).parent().next(".search_result").find("ul").empty();
							$(this).parent().next(".search_result").hide();
						}
					})
				},
				//是否在数组中存在
				isExistInArr:function(value,array){
					var isExist=false;
					for(var i in array){
						if(array[i]==value){
							isExist=true;
							break;
						}
					}
					return isExist;
				},
				setSearchHistory:function(self){
					var ls_search_history=localStorage.getItem("search_history_ac-equipment");
					if(ls_search_history == null){
						self.parent().next(".search_result").find("ul").empty().append("<li>无搜索记录！</li>");
					}else{
						var search_history=ls_search_history.split(","),html="";
						search_history.forEach(function(object){
							html+="<li><a href='javascript:;' data-id="+object.split("|")[0]+"><i class='fa fa-plus fa-mg'></i><i class='fa fa-square-o fa-mg'></i><span>"+object.split("|")[1]+"</span></a></li>";
						})
						self.parent().next(".search_result").find("ul").empty().append(html);
					}
				}
			};
			return {
				init: function(container, config) {
					//window.onload=function(){
						var tree = treeCore(config);
						var json_str = tree.config.json_str,json_data;
						json_data = ajax.parseJson(json_str);
						
						if(json_data && json_data.data) {
							ajax.callback(container, json_data, config);
							return;
						}
						//var json_str=tree.config.json_str;

						ajax.getAjax(container,tree.config);
						
						//var json_str=ajax.getAjax(tree.config.url);
						//var json_data,html=$("#tree_tpl").val(),newHtml="";
						//json_data=ajax.parseJson(json_str);
						//json_data=json_str;
						//newHtml=ajax.joint(json_data,html,newHtml);
						//插入页面	
						//$(container+">ul").append(newHtml);
						//eventHandler.doExpand(container);
						//eventHandler.doCheck(container);
					//}

				}
			}
		}();

		$.fn.Tree = function(config) { debugger;//调用组件入口,传入一个对象将要使用的参数
			Tree.init(this.selector, config); //元素，数据
		}

})(jQuery,window);