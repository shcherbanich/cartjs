if(!Array.indexOf)
{
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    }
}


$.cart = {
	defined : {
		name:'item',
		items: false,
		cookie: true,
		lifeTime:7,
		path: "/",
		localStorage:true,
		limitItems:100,
		blocked_id:[],
		add_methods: {},
		constructor: function(){},
		trigger: function(){}
	},
	init : (function(settings){	
		this.__triggers = {};
		this.__save = {};
		this.__callEvent = function(func,trigger){
			return function(){
				try{
					object = this;
					if(trigger['before'])
						trigger['before'].call(arguments);
					var result =	(function(object,arguments){
										return func.apply(object,arguments);
									})(object,arguments);		
					if(trigger['after'])
						trigger['after'].call(arguments);
				}
				catch(e){
					if(trigger['error'])
						trigger['error'].call(arguments);
				}
				if(trigger['complete'])
					trigger['complete'].call(arguments);	
				if(result) return result;
				return 0;
			}
		}
		
		this.add_trigger = function(object){
			if(typeof object != "object") return 0;
			var temp = {},
				temp2 = {};
			for (var i in object){
				if(!this.__save[i]){	
					temp[i] = this[i];
					this[i] = this.__callEvent(this[i],object[i]);
					this.__triggers[i] = object[i];
					this.__save = $.extend({},this.__save,temp);
				}
				else{ 
					this.__triggers[i] = $.extend(this.__triggers[i],this.__triggers[i],object[i]);
					this.delete_triggers(i);
					temp2[i] = this.__triggers[i];
					this.add_trigger(temp2);
				}
			}
			return 1;
		}
		
		this.delete_triggers = function(name){
			if(!name) return 0;
			if(typeof name != "object") name = [name];
			for (var i in name){
				if(this.__save[name[i]]){
					this[name[i]] = this.__save[name[i]];
					delete this.__save[name[i]];
				}
			}
			return 1;
		}
		
		this.remove_trigger = function(object){
			if(!object) return 0;
			for (var i in object){
				if(typeof object[i] != "object") object[i] = [object[i]];
				for (var key in object[i])
					if(this.__triggers[i])delete this.__triggers[i][object[i][key]];	
			}
			return 1;
		}
	

		this.reset = function(settings){
			this.options = $.extend({},this.options,settings);
			if(this.options.constructor) this.options.constructor();
			if(this.options.items) this.SetData(this.options.items);
			var temp = {};
			if(this.options.trigger)
				this.add_trigger(this.options.trigger);
			if(arguments[1]) return arguments[1]();
			return 1;
		}
		
		this.remove_method = function(){
			if(!arguments[0]) return 0;
			var name = arguments[0];
			if(delete this[name]){
				if(arguments[1]) return arguments[1]();	
				return 1;
			}
			if(arguments[1]) return arguments[1]();	
			return 0;
		}
		
		this.add_method = function(){
			if(typeof arguments[0] != "object") return 0;
			$.extend(this,this,arguments[0]);
			if(arguments[1]) return arguments[1]();	
			return 1;
		}
		
		this.SetData = function(obj){
			obj = $.toJSON(obj);
			this.items = obj;
			if(this.options.cookie)$.cookie(this.options.name,obj,{expires:this.options.lifeTime,path:this.options.path});
			if(typeof(localStorage)!='undefined'&&this.options.localStorage){
				try{
					localStorage.setItem(this.options.name,obj);
				}
				catch(e){
					this.options.localStorage = false;
				}
			}
			if(arguments[1]) return arguments[1]();	
			return 1;
		}
		
		this.test_data = function(){
			if(typeof arguments[0] != "object") return 0;
			var items = this.get('array'),
				array = [];
			for (var i in items)
				if(arguments[0].indexOf(items[i][0])!=-1) array[i] = items[i][0]+':'+items[i][1];
			this.SetData(array);
			return 1;
		}
		
		this.clear = function(){
			this.items = {};
			if(this.options.cookie)$.cookie(this.options.name,null,{expires:new Date(0),path:this.options.path});
			if(typeof(localStorage)!='undefined'&&this.options.localStorage){
				try{
					localStorage.removeItem(this.options.name);
				}
				catch(e){
					this.options.localStorage = false;
				}
			}
			if(arguments[0]) return arguments[0]();	
			return 1;
		}
		
		this.GetData = function(){
			if($.cookie(this.options.name&&this.options.cookie))return($.cookie(this.options.name));
			else if(typeof(localStorage)!='undefined'&&this.options.localStorage){
				try{
					if(localStorage.getItem(this.options.name)){
						return (localStorage.getItem(this.options.name));
					}
					else return 0;
				}
				catch(e){
					this.options.localStorage = false;
					return 0;
				}
			}
			else if(this.items) return this.items;
			else return 0;
		}
		
		this.test_limit = function(id,number){
			if(typeof this.options.limitItems != "object") return (number>=this.options.limitItems)?this.options.limitItems:number;
			else{
				for (var j in this.options.limitItems){
					if (this.options.limitItems[j][0]==id&&typeof this.options.limitItems[j][0] != "object"){
						number = (number>=this.options.limitItems[j][1])?this.options.limitItems[j][1]:number;
						break;
					}
					else if(typeof this.options.limitItems[j][0] == "object"){
						if (this.options.limitItems[j][0].indexOf(id)!=-1){
							number = (number>=this.options.limitItems[j][1])?this.options.limitItems[j][1]:number;
							break;
						}
					}
					else if(this.options.limitItems[j][0]!=id&&typeof this.options.limitItems[j]=='number'){
						number = (number>=this.options.limitItems[j])?this.options.limitItems[j]:number;
					}
				}
				return number;
			}
		}
		
		this.add = function(){
			if (!arguments[0])return 0;	
			var number,
				flag = 0;	
			if(typeof arguments[0] != "object"){
				var id = [arguments[0]];	
				if(typeof arguments[1] != "object")	arguments[1] = [(arguments[1]||1)];
			}
			else{
				var id = arguments[0];
				if(typeof arguments[1] != "object"){
					var temp = [];
					for (var i in id)
						temp[i] = (arguments[1]||1);	
					arguments[1] = temp;
				}
			}
			for (var i in id){
				if(typeof this.options.blocked_id != "object") this.options.blocked_id = [this.options.blocked_id];
				if(this.options.blocked_id.indexOf(id[i])==-1){
					number = (parseInt(arguments[1][i])||1);
					if(this.GetData()){
						var items = $.secureEvalJSON(this.GetData())+'',
							val;
						items = items.split(",");	
						for (var key in items){
							val = items[key].split(":");
							if (val[0]==id[i]){
								number = this.test_limit(id[i],parseInt(val[1])+number);
								items[key] = val[0]+':'+number;
								this.SetData(items);
								flag = 0;
								break;
							}
							else flag = 1;
						}
					}
					else{
						var items = [];
						flag = 1;
					}
					number = this.test_limit(id[i],number);
					if(flag) items.push(id[i]+":"+number);
					this.SetData(items);
				}
			}		
			if(arguments[2]) return arguments[2]();
			return 1;		
		}
		
		this.delete_item = function(){
			if (!arguments[0]) return 0;	
			var array = this.get('array'),
				items = [],
				id = arguments[0],
				j = 0;				
			if(typeof id != "object")	id = [id];
				for (var i=0;i<array.length;i++)
					if(id.indexOf(array[i][0])==-1){
						items[j] = array[i][0]+':'+array[i][1];
						++j;
					}
			if (!items.length){
				this.clear();
				if(arguments[1]) return arguments[1]();
				return 0;
			}
			this.SetData(items);
			if(arguments[1]) return arguments[1]();
			return 1;
		}
		
		this.remove = function(){
			if (!arguments[0])return 0;	
			var number,
				flag = 0;	
			if(typeof arguments[0] != "object"){
				var id = [arguments[0]];	
				if(typeof arguments[1] != "object")	arguments[1] = [(arguments[1]||1)];
			}
			else{
				var id = arguments[0];
				if(typeof arguments[1] != "object"){
					var temp = [];
					for (var i in id)
						temp[i] = (arguments[1]||1);	
					arguments[1] = temp;
				}
			}
			for (var i in id){
				number = (parseInt(arguments[1][i])||1);
				if(this.GetData()){
					var items = $.secureEvalJSON(this.GetData())+'',
						val;
					items = items.split(",");	
					for (var key in items){
						val = items[key].split(":");
						if (val[0]==id[i]){
							number = parseInt(val[1])-number;
							if(number<=0) this.delete_item(val[0]);
							else {
								items[key] = val[0]+':'+number;
								this.SetData(items);
							}
							break;
						}
					}
				}
				else{
					if(arguments[2]) return arguments[2]();
					return 1;
				}	
			}		
			if(arguments[2]) return arguments[2]();
			return 1;		
		}
		
		this.get = function(){
			if(!this.GetData()) return 0;
			var items = $.secureEvalJSON(this.GetData());
			switch (arguments[0]){
				case 'string': return this.GetData(); break
				case 'array':
					var arr = [],
						val;
						items = items+'';
						items = items.split(",");
					for (var i in items){
						val = items[i].split(":");
						arr[i] = [];
						for (var j in val){
							if(val[j]) arr[i][j] = val[j];
						}
					}
					return arr;
				break
				case 'object':
					var obj = {},
						val;
						items = items+'';
						items = items.split(",");
					for (var i in items){
						val = items[i].split(":");
						obj[val[0]] = val[1];
					}
					return obj;
				break		
				default: return items;
			}
		}
		
		this.search = function(){
			if (!arguments[0]) return 0;
			arguments[0] = Math.abs(parseInt(arguments[0]));		
			id = arguments[0];
			var array = [];
			array = this.get('array');
			for (var i=0;i<array.length;i++)
				if(array[i][0]==id) return array[i][1];
			return 0;
		}
		
		this.swap = function(){
			if (!arguments[1]) arguments[1] = 0;
			arguments[0] = Math.abs(parseInt(arguments[0]));
			arguments[1] = Math.abs(parseInt(arguments[1]));
			var items = this.get();		
			if(items[arguments[0]]&&items[arguments[1]]){
				temp = items[arguments[0]];
				items[arguments[0]] = items[arguments[1]];
				items[arguments[1]] = temp;
				this.SetData(items);
				if(arguments[2]) return arguments[2]();
				return 1;
			}
			if(arguments[2]) return arguments[2]();
			return 0;
		}
		
		this.set_num = function(){
			if (!arguments[1]) return 0;
			var items = this.get();
			if(items[arguments[0]]){
				var array = items[arguments[0]].split(':');
				items[arguments[0]] = array[0]+':'+this.test_limit(array[0],Math.abs(parseInt(arguments[1])));
				this.SetData(items);
				if(arguments[2]) return arguments[2]();
				return 1;
			}
			if(arguments[2]) return arguments[2]();
			return 0;
		}
		
		this.moving = function(){
			if (!arguments[1]) arguments[1] = 0;
			arguments[0] = Math.abs(parseInt(arguments[0]));
			arguments[1] = Math.abs(parseInt(arguments[1]));
			if(arguments[0]<arguments[1])
				for(var i = arguments[0];i<arguments[1];i++)
					this.swap(i,i+1);
			else
				for(var i = arguments[0];i>arguments[1];i--)
					this.swap(i,i-1);
			if(arguments[2]) return arguments[2]();
			return 1;
		}
		
		return (function(object){
					object.options = $.extend({},$.cart.defined,settings);
					if(object.options.add_methods) $.extend(object,object,object.options.add_methods);
					if(object.options.constructor) object.options.constructor();
					if(object.options.items) object.SetData(object.options.items);
					var temp = {};
					if(object.options.trigger)
						for (var i in object.options.trigger)
							object.add_trigger(object.options.trigger);
					return object;
				})(this);
	})
}
