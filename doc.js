/**
 * @page About
 * If you want to know how to USE doc.js, please see the [Github page](https://github.com/schteppe/doc.js).
 * 
 * The code for doc.js follows this algorithm:
 * 
 * 1. Load files
 * 2. Parse and construct DOCJS.Block objects
 * 3. Parse commands from the blocks, get a list of DOCJS.Command objects
 * 4. Assemble the DOCJS.Command's to DOCJS.Entity objects.
 * 5. The entities are stored in a DOCJS.Documentation.
 * 6. Render to HTML.
 */

/**
 * @library doc.js
 * @version 0.1.4
 * @brief A doc generator written in JavaScript
 */
var DOCJS = {};

/**
 * @function DOCJS.Generate
 * @param Array urls
 * @param Object opt
 * @brief Generate Doc.js documentation.
 * @example
 * You use the function like this: ```DOCJS.Generate(["file.js"],options);```
 * 
 * ...and then you're done!
 * 
 * The options may look like this:
 * 
 *     {
 *       title :           "Hello World!",
 *       description :     "My first Doc.js documentation",
 *       showSourceUrl :   true,
 *       formatSourceUrl : function(file, lineNum){ return file; },
 *       renderer :        new DOCJS.HTMLRenderer(),
 *       fileLoader :      new DOCJS.AjaxFileLoader(),
 *       showErrors :      true,
 *       showTodos :       true
 *     }
 * 
 * * ```title``` (string) is the title of the documentation.
 * * ```description``` (string) is a short description of the documentation.
 * * ```showSourceUrl``` (bool) can turn on/off visibility of the source links
 * * ```renderer```  is the DOCJS.Renderer to use.
 * * ```fileLoader``` is a DOCJS.FileLoader
 * 
 * @endexample
 */
DOCJS.Generate = function(urls,opt){

    // Options
    opt = opt || {};
    var options = {
	title:"Hello World!", // Should these be fetched from the blocks?
	description:"My first Doc.js documentation",
	showSourceUrl : true,
        formatSourceUrl : function(filename,lineNumber){ return filename; },
	renderer : null,
	fileLoader : null,
	showErrors : true,
	showTodos : true
    };
    // Extend options
    for(var key in opt)
	if(key in options)
	    options[key] = opt[key];

    /**
     * @class DOCJS.FileLoader
     */
    DOCJS.FileLoader = function(){
	/**
	 * @method load
	 * @param string filename
	 * @param function callback callback(error,data)
	 */
	this.load = function(filename,callback){
	    throw new Error("Method .load(file,callback) must be implemented in subclasses of FileLoader!");
	};
    };

    /**
     * @class DOCJS.FileLoader
     * @extends DOCJS.AjaxFileLoader
     */
    DOCJS.AjaxFileLoader = function(){
	DOCJS.FileLoader.call(this);
	this.load = function(url,callback){
	    var xmlhttp;
	    if (window.XMLHttpRequest){
		// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	    } else {
		// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	    }
	    xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState==4){
		    if(xmlhttp.status==200)
			callback(null,xmlhttp.responseText);
		    else 
			callback(new DOCJS.ErrorReport(url,0,"Could not load file "+url));
		}
	    };
	    xmlhttp.open("GET",url,true);
	    xmlhttp.send();
	};
    };

    /**
     * @class DOCJS.Renderer
     * @brief Base class for renderers
     */
    DOCJS.Renderer = function(){
	this.render = function(doc){
	    throw new Error("A DOCJS.Renderer must implement a method .render(doc)!");
	};
    };

    /**
     * @class DOCJS.HTMLRenderer
     * @brief Can render documentation to HTML
     * @extends DOCJS.Renderer
     */
    DOCJS.HTMLRenderer = function(){
	DOCJS.Renderer.call(this);
	
	/**
	 * @method render
	 * @param DOCJS.Documentation doc
	 * @return string The resulting HTML
	 */
	this.render = function(doc){
	    return makeBody();

	    function makeBody(){
		return ("<article>"+makeNav()+makeContent()+"</article>"+makeFooter());
	    }

	    function makeNav(){
		var nav = "<nav>";
		var desc = (doc.library ? doc.library.getBrief() : ""),
		version = (doc.library ? doc.library.getVersion() : ""), 
		title = (doc.library ? doc.library.getName() : "Hello World!");
		nav += "<div id=\"logo\"><h1><span id=\"libtitle\">"+title+"</span><sup id=\"libversion\">"+version+"</sup></h1><p id=\"libdesc\">"+desc+"</p></div>";

		// Pages links
		if(doc.pages.length){
		    nav += "<h2>Pages</h2><ul>";
		    for(var i=0; i<doc.pages.length; i++){
			var p = doc.pages[i];
			nav += "<li><a href=\"#pages-"+toNice(p.getName())+"\">"+p.getName()+"</a></li>";
		    }
		    nav += "</ul>";
		}

		// Functions links
		if(doc.functions.length){
		    nav += "<h2>Functions</h2><ul>";
		    for(var i=0; i<doc.functions.length; i++){
			var f = doc.functions[i];
			nav += "<li><a href=\"#functions-"+toNice(f.getName())+"\">"+f.getName()+"</a></li>";
		    }
		    nav += "</ul>";
		}

		// Classes links
		if(doc.pages.length){
		    nav += "<h2>Classes</h2><ul>";
		    for(var i=0; i<doc.classes.length; i++){
			var c = doc.classes[i];
			nav += "<li><a href=\"#classes-"+toNice(c.getName())+"\">"+c.getName()+"</a></li>";
		    }
		    nav += "</ul>";
		}

		// Todos
		if(doc.pages.length){
		    nav += "<h2>Todos ("+doc.pages.length+")</h2>";
		}

		// Errors
		if(doc.errors.length){
		    nav += "<h2>Errors ("+doc.errors.length+")</h2>";
		}
		nav += "</nav>";

		return nav;
	    }

	    function makeContent(){
		return "<div id=\"content\">"+makePages()+makeFunctions()+makeClasses()+makeTodos()+makeErrors()+"</div>";
	    }

	    function makeFooter(){
		return "<footer><p>Documentation generated by <a href=\"http://github.com/schteppe/doc.js\">doc.js</a>.</p></footer>";
	    }
	    
	    function makePages(){
		var html = "";
		if(doc.pages.length > 0){
		    html += "<section id=\"pages\"><h1>Pages</h1>";
		    for(var i=0; i<doc.pages.length; i++){
			var page = doc.pages[i];
			html += ("<section id=\"pages-"+toNice(page.getName())+"\"><h2>"+page.getName()+"</h2>"+markDown2HTML(page.getContent())+"</section>");
		    }
		    html += "</section>";
		}
		return html;
	    }

	    // Functions
	    function makeFunctions(){
		var html = "";
		if(doc.functions.length > 0){
		    html += "<section id=\"functions\"><h1>Functions</h1>";
		    for(var i=0; i<doc.functions.length; i++){
			var f = doc.functions[i];
			html += ("<section id=\"functions-"+toNice(f.getName())+"\"><h2>"+f.getName()+"</h2>");
			
			// Brief
			if(f.getBrief()){
			    html += ("<p class=\"brief\">"+f.getBrief()+"</p>");
			}
			
			// Description
			html += "<h3>Description</h3>";
			var params = [];
			for(var k=0; k<f.numParams(); k++){
			    params.push("<span class=\"datatype\">"+nameToLink(f.getParamDataType(k))+"</span> <span>" + f.getParamName(k) + "</span>");
			}
			html += ("<span class=\"datatype\">"+
				 (f.getReturnDataType() ? f.getReturnDataType() : "")+
				 "</span> <span>" + 
				 f.getName() + 
				 " ( " + params.join(" , ") + " ) </span>");
			
			// Description
			if(f.getDescription()){
			    html += "<p class=\"description\">"+f.getDescription()+"</p>";
			}
			
			// Parameters
			if(f.numParams()>0){
			    html += ("<h3>Parameters</h3>" + 
				     "<table class=\"member_overview\">");
			    for(var k=0; k<f.numParams(); k++){
				html += ("<tr>" + 
					 "<td class=\"datatype\">"+nameToLink(f.getParamDataType(k) ? f.getParamDataType(k) : "")+"</td>" + 
					 "<td class=\"paramName\">" + f.getParamName(k) + "</td>" + 
					 "<td class=\"brief\">"+(f.getParamDescription(k) ? f.getParamDescription(k) : "") + "</td>" + 
					 "</tr>");
			    }
			    html += "</table>";
			}
			
			// Return value
			if(f.getReturnDescription()){
			    html += "<h3>Return value</h3>";
			    html += "<p>"+f.getReturnDescription()+"</p>";
			}
			
			// Examples
			if(f.numExamples()){
			    for(var j=0; j<f.numExamples(); j++){
				html += "<h3>Example "+(j+1)+"</h3><div>"+markDown2HTML(f.getExampleText(j))+"</div>";
			    }
			}
			
			// Source
			if(options.showSourceUrl){
			    var url = options.formatSourceUrl(f.block[0].filename,
							      f.block[0].lineNumber);
			    html += "<h3>Source</h3><p><a href=\""+url+"\">"+url+"</a></p>";
			}
			
			html += "</section>";
		    }
		    html += "</section>";
		}
		return html;
	    }
	    
	    // Classes
	    function makeClasses(){
		var html = "";
		if(doc.classes.length)
		    html += "<section id=\"classes\"><h1>Classes</h1>";
		for(var i=0; i<doc.classes.length; i++){
		    var c = doc.classes[i];
		    
		    html += ("<section id=\"classes-"+toNice(c.getName())+"\">"+
			     "<h2>"+c.getName()+"</h2>");
		    
		    // Brief
		    if(c.getBrief())
			html += ("<p class=\"brief\">"+c.getBrief()+"</p>");
		    
		    // Inheritance list
		    var extendsList = doc.getInheritanceList(c);
		    extendsList.shift();
		    if(extendsList.length >= 1){
			for(var j=0; j<extendsList.length; j++)
			    extendsList[j] = nameToLink(extendsList[j]);
			html += ("<p>Extends "+extendsList.join(" → ")+"</p>");
		    }
		    
		    // Constructor
		    var args = [];
		    for(var j=0; j<c.numParams(); j++)
			args.push("<span class=\"datatype\">"+nameToLink(c.getParamDataType(j))+"</span> " + c.getParamName(j));
		    html += ("<h3>Constructor</h3>" +
			     "<p>"+c.getName() + " ( " + args.join(" , ")+" )</p>");
		    
		    // Method overview table
		    var numMethods = c.numMethods();
		    if(numMethods>0){
			html += ("<h3>Methods</h3>"+
				 "<table class=\"member_overview\">");
			for(var k=0; k<numMethods; k++){
			    var method = c.getMethod(k);
			    var params = [];
			    for(var l=0; l<method.numParams(); l++){
				params.push("<span class=\"datatype\">"+nameToLink(method.getParamDataType(l))+"</span>" + " " + method.getParamName(l));
			    }
			    html += ("<tr><td class=\"datatype\">"+(method.getReturnDataType() ? method.getReturnDataType() : "")+"</td><td>"
				     + "<span class=\"methodName\">"+method.getName() + "</span> ( " +params.join(" , ")+ " )</td></tr>" +
				     "<tr><td></td><td class=\"brief\">"+(method.getBrief() ? method.getBrief() : "")+"</td></tr>");
			}
			html += "</table>";
		    }
		    
		    // Properties
		    var numProperties = c.numProperties();
		    if(numProperties>0){
			html += ("<h3>Properties</h3>"+
				 "<table class=\"member_overview\">");
			for(var k=0; k<numProperties; k++){
			    html += ("<tr><td class=\"datatype\">"+nameToLink(c.getPropertyDataType(k))+"</td><td class=\"propertyName\">" + c.getPropertyName(k) + "</td><td class=\"brief\">"+(c.getPropertyBrief(k) ? c.getPropertyBrief(k) : "")+"</td></tr>");
			}
			html += "</table>";
		    }

		    // Examples
		    if(c.numExamples()){
			for(var j=0; j<c.numExamples(); j++){
			    // Example
			    html += ("<h3>Example "+(j+1)+"</h3><div>"+markDown2HTML(c.getExampleText(j))+"</div>");
			}
		    }
		    
		    // Source
		    if(options.showSourceUrl){
			var url = options.formatSourceUrl(c.block[0].filename,
							  c.block[0].lineNumber);
			html += ("<h3>Source</h3><p><a href=\""+url+"\">"+url+"</a></p>");
		    }

		    html += "</section>";
		}

		if(doc.classes.length)
		    html += "</section>";
		return html;
	    }

	    // Todos
	    function makeTodos(){
		var html = "";
		if(options.showTodos){
		    for(var i=0; i<doc.todos.length; i++){
			if(i==0)
			    html += "<section id=\"todos\"><h1>Todos ("+doc.todos.length+")</h1>";
			var todo = doc.todos[i];
			html += ("<div id=\"todos-"+todo.id+"\">" +
				 "<h2>"+todo.block[0].filename+" line "+todo.getLine()+"</h2>" +
				 "<p>"+todo.getContent()+"</p></div>");
			if(i==doc.todos.length-1)
			    html += "</section>";
		    }
		}
		return html;
	    }

	    // Errors
	    function makeErrors(){
		var html = "";
		if(options.showErrors){
		    for(var i=0; i<doc.errors.length; i++){
			if(i==0)
			    html += "<section id=\"errors\"><h1>Errors ("+doc.errors.length+")</h1>";
			var error = doc.errors[i];
			html += ("<div id=\"errors-"+error.id+"\">" +
				 "<h2>Error "+error.id+"</h2><p>"+error.file+" on line "+error.lineNumber+"</p>" + 
				 "<p>"+error.message+"</p></div>");
			if(i==doc.errors.length-1)
			    html += "</section>";
		    }
		}
		return html;
	    }
	    
	    // Convert a name to a link, or just return the input name
	    function nameToLink(name){
		var r = name;
		var entity = doc.nameToEntity(name);
		if(entity){
		    if(entity instanceof DOCJS.ClassEntity)
			r = "<a href=\"#classes-"+toNice(name)+"\">"+name+"</a>";
		}
		return r;
	    }

	    function markDown2HTML(m){
		if(typeof(Markdown)!="undefined"){
		    var converter = Markdown.getSanitizingConverter();
		    return converter.makeHtml(m);
		} else
		    return "<div>"+m+"</div>"; // todo
	    }
	};
    };
    
    loadBlocks(urls,function(blocks,errors){
	var doc = makeEntities(blocks,errors);
	if(!options.renderer)
	    options.renderer = new DOCJS.HTMLRenderer();
	var html = (options.renderer.render(doc));
	document.body.innerHTML = html;
    });

    var idCount = 0;
    function newId(){
	return ++idCount;
    }

    // Utility functions
    function trim(s){ return s.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); }
    function ltrim(s){ return s.replace(/^\s+/,''); }
    function rtrim(s){ return s.replace(/\s+$/,''); }
    function fulltrim(s){ return s.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '); }
    function toNice(s){
	var clean = s.replace(/[^a-zA-Z0-9\/_|+ -]+/g, '');
	clean = trim(clean.toLowerCase());
	clean = clean.replace(/[\s\n\t]+/g," ").replace(/\s+/g,"-");
	clean = clean.replace(/[\/_|+ -]+/g, "-");
	return clean;
    }

    // A comment block in the code.
    var blockIdCounter = 0;

    /**
     * @class DOCJS.Block
     * @brief Container for a documentation comment block.
     * @param string src
     * @param string rawSrc
     * @param int lineNumber
     */
    DOCJS.Block = function(src,rawSrc,lineNumber){
	this.id = ++blockIdCounter; /// @property int id
	// Diff between src and rawSrc in lines, needed to convert between local and global line numbers
	var idx = rawSrc.indexOf(src);
	this.rawDiff = (rawSrc.substr(0,idx).match(/\n/g)||[]).length; /// @property int rawDiff

	var lines, parsedLines = [], that=this;
	function splitLines(){
	    if(!lines) lines = src.split("\n");
	}

	this.filename = "";           /// @property string filename
	this.src = src;               /// @property string src
	this.rawSrc = rawSrc;         /// @property string rawSrc
	this.lineNumber = lineNumber; /// @property int lineNumber

	this.author = [];   /// @property Array author
	this.brief = [];    /// @property Array brief
	this.classs = [];   /// @property Array classs
	this.desc = [];     /// @property Array desc
	this.event = [];    /// @property Array event
	this.example = [];  /// @property Array example
	this.file = [];     /// @property Array file
	this.func = [];     /// @property Array func
	this.memberof = []; /// @property Array memberof
	this.method = [];   /// @property Array method
	this.page = [];     /// @property Array page
	this.param = [];    /// @property Array param
	this.property = []; /// @property Array property
	this.ret = [];      /// @property Array ret
	this.see = [];      /// @property Array see
	this.todo = [];     /// @property Array todo

	this.localToGlobalLineNumber = function(lineNumber){
	    return parseInt(lineNumber) + that.lineNumber + that.rawDiff + 1;
	};
	this.markLineAsParsed = function(lineNumber){
	    if(!that.lineIsParsed(lineNumber))
		parsedLines.push(parseInt(lineNumber));
	};
	this.markChunkAsParsed = function(chunk){
	    var idx = src.indexOf(chunk);
	    if(idx != -1){
		var start = idx;
		var end = start+chunk.length;
		var firstLine = (src.substring(0,start).match(/\n/gm)||[]).length;
		var lastLine = (src.substring(start,end).match(/\n/gm)||[]).length + firstLine;
		for(var i=firstLine; i<=lastLine; i++)
		    that.markLineAsParsed(i+that.rawDiff);
	    }
	};
	this.lineIsParsed = function(lineNumber){
	    return parsedLines.indexOf(parseInt(lineNumber))!==-1;
	};
	this.getLine = function(lineNumber){
	    splitLines();
	    return lines[parseInt(lineNumber)];
	};
	this.getNumLines = function(){
	    splitLines();
	    return lines.length;
	};
	this.getUnparsedLines = function(){
	    var unparsed = [], n = that.getNumLines();
	    for(var i=0; i<n; i++){
		if(!that.lineIsParsed(i))
		    unparsed.push(that.getLine(i));
	    }
	    return unparsed;
	};
	// Get object: linenumber => line
	this.getUnparsedLines2 = function(globalLineNumbers){
	    var unparsed = {}, n = that.getNumLines();
	    for(var i=0; i<n; i++){
		if(!that.lineIsParsed(i)){
		    if(globalLineNumbers)
			unparsed[that.localToGlobalLineNumber(i)] = that.getLine(i);
		    else
			unparsed[i] = that.getLine(i);			
		}
	    }
	    return unparsed;
	};
	// get line of first string match
	this.getLineNumber = function(s){
	    var idx = that.src.indexOf(s);
	    if(idx!=-1){
		var lineNumber = (that.src.substr(0,idx).match(/\n/g)||[]).length;
		return lineNumber;
	    } else
		return false;
	}
    }

    /**
     * @class DOCJS.ErrorReport
     * @brief Container for parsing errors.
     * @param string filename
     * @param int lineNumber
     * @param string message
     */
    var errorReportIdCounter = 0;
    DOCJS.ErrorReport = function(filename,lineNumber,message){
	this.lineNumber = lineNumber;
	this.file = filename;
	this.message = message;
	this.id = ++errorReportIdCounter;
    }

    // An Entity is a set of Command's
    // The Entities corresponds to a thing that is viewed to the user, eg. Function, Class etc.
    var globalEntityCounter = 0; // ids unique to all entities
    var entityCounter = {}; // entityName => number. Ids unique within entity type.

    /**
     * @class DOCJS.Entity
     * @param DOCJS.Block block
     * @param string entityName
     * @brief Base class for entities.
     */
    DOCJS.Entity = function(block,entityName){
	/// @property DOCJS.Block block The block where where the Entity was defined
	this.block = block;

	if(!(entityName in entityCounter))
	    entityCounter[entityName] = 0;
	else
	    entityCounter[entityName]++;

	/// @property int id
	this.id = entityCounter[entityName];
	/// @property int globalId
	this.globalId = ++globalEntityCounter;
    }

    /**
     * @class DOCJS.FileEntity
     * @param DOCJS.Block block
     * @param DOCJS.FileCommand fileCommand
     * @extends DOCJS.Entity
     */
    DOCJS.FileEntity = function(block,fileCommand){
	DOCJS.Entity.call(this,block);
	this.getName = function(){
	    return fileCommand.getName();
	};
    }

    /**
     * @class DOCJS.FunctionEntity
     * @param DOCJS.Block block
     * @param DOCJS.FunctionCommand functionCommand
     * @param DOCJS.ParamCommand paramCommand
     * @param DOCJS.ReturnCommand returnCommand Optional
     * @param DOCJS.BriefCommand briefCommand Optional
     * @param DOCJS.DescriptionCommand descriptionCommand Optional
     * @param DOCJS.ExampleCommand exampleCommand Optional
     * @extends DOCJS.Entity
     */
    DOCJS.FunctionEntity = function(block,
				    functionCommand,
				    paramCommands,
				    returnCommand, // optional
				    briefCommand,   // optional
				    descriptionCommand, // optional
				    exampleCommand // optional
				   ){
	DOCJS.Entity.call(this,block);
	/**
	 * @method getName
	 * @memberof DOCJS.FunctionEntity
	 * @return string Returns string or false on failure.
	 */
	this.getName = function(){ return functionCommand ? functionCommand.getName() : false; };
	/**
	 * @method getBrief
	 * @memberof DOCJS.FunctionEntity
	 * @return string Returns string or false on failure.
	 */
	this.getBrief = function(){ return briefCommand ? briefCommand.getContent() : false; };
	this.getDescription = function(){ return descriptionCommand ? descriptionCommand.getContent() : false; };
	this.getReturnDataType = function(){ return returnCommand ? returnCommand.getDataType() : false; };
	this.getReturnDescription = function(){ return returnCommand ? returnCommand.getDescription() : false; };

	this.numParams = function(){ return paramCommands.length; };
	this.getParamDataType = function(i){ return paramCommands[i].getDataType(); };
	this.getParamName = function(i){ return paramCommands[i].getName(); };
	this.getParamDescription = function(i){ return paramCommands[i].getDescription(); };
	this.addParam = function(p){ paramCommands.push(p); };

	this.numExamples = function(){ return exampleCommand ? exampleCommand.length : 0; };
	this.getExampleText = function(i){ return exampleCommand[i].getContent(); };
    }

    /**
     * @class DOCJS.LibraryEntity
     * @param DOCJS.Block block
     * @param DOCJS.LibraryCommand libraryCommand
     * @param DOCJS.VersionCommand versionCommand Optional
     * @param DOCJS.BriefCommand briefCommand Optional
     * @param DOCJS.DescriptionCommand descriptionCommand Optional
     * @extends DOCJS.Entity
     */
    DOCJS.LibraryEntity = function(block,
				   libraryCommand,
				   versionCommand, // optional
				   briefCommand,   // optional
				   descriptionCommand // optional
				  ){
	DOCJS.Entity.call(this,block);
	this.getName = function(){ return libraryCommand ? libraryCommand.getName() : false; };
	this.getBrief = function(){ return briefCommand ? briefCommand.getContent() : false; };
	this.getDescription = function(){ return descriptionCommand ? descriptionCommand.getContent() : false; };
	this.getVersion = function(){ return versionCommand ? versionCommand.getContent() : false; };
    }

    /**
     * @class DOCJS.MethodEntity
     * @param DOCJS.Block block
     * @param DOCJS.MemberofCommand memberof
     * @param DOCJS.ParamCommand param
     * @param DOCJS.BriefCommand brief
     * @param DOCJS.ReturnCommand return
     * @extends DOCJS.Entity
     */
    DOCJS.MethodEntity = function(block,
				  methodCommand,
				  memberofCommand,
				  paramCommands,
				  briefCommand,
				  returnCommand){
	DOCJS.Entity.call(this,block);
	this.getName = function(){ return methodCommand.getName(); };
	this.getClassName = function(){ return memberofCommand.getClassName(); };

	this.numParams = function(){ return paramCommands.length; };
	this.getParamDataType = function(i){ return paramCommands[i].getDataType(); };
	this.getParamName = function(i){ return paramCommands[i].getName(); };

	this.getBrief = function(){ return briefCommand ? briefCommand.getContent() : false; };
	this.getReturnDataType = function(){ return returnCommand ? returnCommand.getDataType() : false; };
    }

    /**
     * @class DOCJS.PropertyEntity
     * @param DOCJS.Block block
     * @param DOCJS.PropertyCommand property
     * @param DOCJS.MemberofCommand memberof
     * @param DOCJS.BriefCommand brief
     * @param DOCJS.DescriptionCommand description
     * @extends DOCJS.Entity
     */
    DOCJS.PropertyEntity = function(block,
				    propertyCommand,
				    memberofCommand,
				    briefCommand, // optional
				    descriptionCommand // optional
				   ){
	DOCJS.Entity.call(this,block);
	this.getName = function(){ return propertyCommand.getName(); };
	this.getClassName = function(){ return memberofCommand.getClassName(); };
	this.getDataType = function(){ return propertyCommand.getDataType(); };
	this.getBrief = function(){ return briefCommand ? briefCommand.getContent() : false; };
	this.getDescription = function(){ return descriptionCommand ? descriptionCommand.getContent() : false; };
    }

    /**
     * @class DOCJS.TodoEntity
     * @param DOCJS.Block block
     * @param DOCJS.TodoCommand todoCommand
     * @extends DOCJS.Entity
     */
    DOCJS.TodoEntity = function(block,todoCommand){
	DOCJS.Entity.call(this,block);
	this.getContent = function(){ return todoCommand.getContent(); };
	this.setEntity = function(e){ entity = e; };
	this.getLine = function(){ return todoCommand.getBlock().lineNumber; };
    }

    /**
     * @class DOCJS.ClassEntity
     * @param DOCJS.Block block
     * @param DOCJS.ClassCommand classCommand
     * @param DOCJS.ParamCommand paramCommand
     * @param DOCJS.ExtendsCommand extendsCommand
     * @param DOCJS.BriefCommand briefCommand
     * @param DOCJS.DescriptionCommand descriptionCommand
     * @extends DOCJS.Entity
     */
    DOCJS.ClassEntity = function(block,
				 classCommand,
				 paramCommands,
				 extendsCommand, // optional
				 briefCommand, // optional
				 descriptionCommand, // optional
				 exampleCommands){ // optional
	if(!(briefCommand instanceof DOCJS.BriefCommand) && typeof(briefCommand)!="undefined"){
	    throw new Error("Argument 4 must be BriefCommand or undefined, got "+typeof(briefCommand));
	}
	var methodEntities = [];
	var propertyEntities = [];
	DOCJS.Entity.call(this,block);
	this.getName = function(){ return classCommand.getName(); };

	this.numMethods = function(){ return methodEntities.length; };
	this.addMethod = function(m){ methodEntities.push(m); };
	this.getMethod = function(i){ return methodEntities[i]; };

	// Constructor params
	this.numParams = function(){ return paramCommands.length; };
	this.getParamDataType = function(i){ return paramCommands[i].getDataType(); };
	this.getParamName = function(i){ return paramCommands[i].getName(); };
	this.addParam = function(p){ paramCommands.push(p); };

	this.getExtendedClassName = function(){ return extendsCommand ? extendsCommand.getClassName() : false; };

	this.numProperties = function(){ return propertyEntities.length; };
	this.addProperty = function(m){ propertyEntities.push(m); };
	this.getPropertyName = function(i){ return propertyEntities[i].getName(); };
	this.getPropertyDataType = function(i){ return propertyEntities[i].getDataType(); };
	this.getPropertyBrief = function(i){ return propertyEntities[i].getBrief(); };
	this.getBrief = function(){ return briefCommand ? briefCommand.getContent() : false; };

	this.numExamples = function(){ return exampleCommands ? exampleCommands.length : 0; };
	this.getExampleText = function(i){ return exampleCommands[i].getContent(); };
    }

    /**
     * @class DOCJS.PageEntity
     * @param DOCJS.Block block
     * @param DOCJS.PageCommand pageCommand
     * @param string content
     * @extends DOCJS.Entity
     */    
    DOCJS.PageEntity = function(block,pageCommand,content){
	var that = this;
	DOCJS.Entity.call(this,block);
	/**
	 * @method getName
	 * @return string
	 */
	this.getName = function(){ return pageCommand.getName(); };
	this.getContent = function(){ return content; };
    }

    /**
     * @class DOCJS.Documentation
     */
    DOCJS.Documentation = function(){
	var name2class, name2entity, that = this;
	this.pages = [];      /// @property Array pages
	this.classes = [];    /// @property Array classes
	this.files = [];      /// @property Array files
	this.functions = [];  /// @property Array functions
	this.library = false; /// @property Array library
	this.todos = [];      /// @property Array todos
	this.errors = [];     /// @property Array errors
	this.methods = [];    /// @property Array methods
	this.properties = []; /// @property Array properties

	this.update = function(){
	    name2entity = {};

	    // Classes
	    name2class = {};
	    var N = this.classes.length;
	    for(var i=0; i<N; i++){
		var c = this.classes[i];
		var n = c.getName();
		name2class[n] = c;
		name2entity[n] = c;
	    }

	    // Sort
	    var sortbyname = function(a,b){
		if(a.getName() > b.getName()) return 1;
		if(a.getName() < b.getName()) return -1;
		else return 0;
	    };
	    that.pages.sort(sortbyname);
	    that.classes.sort(sortbyname);
	    that.functions.sort(sortbyname);
	};
	this.nameToClass = function(name){
	    var c = name2class[name];
	    if(c) return c;
	    else return false;
	}
	this.nameToEntity = function(name){
	    var c = name2entity[name];
	    if(c) return c;
	    else return false;
	}

	function recurseInheritance(name,nameList){
	    nameList.push(name);
	    var c = that.nameToClass(name);
	    if(!c) return;
	    var extended = c.getExtendedClassName();
	    if(!extended) return;
	    recurseInheritance(extended,nameList);
	}
	this.getInheritanceList = function(classs){
	    var list = [];
	    recurseInheritance(classs.getName(),list);
	    return list;
	};
    };
    

    // Assembles Entity's out of Block's
    function makeEntities(blocks,errors){
	var doc = new DOCJS.Documentation();

	// Add errors to the doc
	for(var i=0; i<errors.length; i++)
	    doc.errors.push(errors[i]);

	var lastClass;

	// Assemble Entities
	for(var i=0; i<blocks.length; i++){
	    var entity, block = blocks[i];

	    // Find block type
	    if(block.page.length){ // Page
		// May only contain 1 @page command
		var pageCommand = block.page[0];
		var lines = block.getUnparsedLines2();
		var lines_array = [];
		for(var lineNumber in lines){
		    var line = lines[lineNumber];
		    lines_array.push(line);
		    block.markLineAsParsed(lineNumber);
		}
		var content = lines_array.join("\n");
		entity = new DOCJS.PageEntity([block],pageCommand,content);
		doc.pages.push(entity);
		
	    } else if(block.classs.length){ // Class
		var nerrors = 0;
		if(block.ret.length){
		    nerrors++;
		    doc.errors.push(new DOCJS.ErrorReport(block.filename,
							  block.lineNumber,
							  "@class blocks may not contain @return"));
		}

		// Todo: May only contain 1 @class command
		// Todo: may not extend itself
		if(block.extends[0] && block.extends[0].getClassName() == block.classs[0].getName()){
		    doc.errors.push(new DOCJS.ErrorReport(block.filename,
							  block.lineNumber,
							  "A class may not extend itself!"));
		    nerrors++;
		}
		if(!nerrors) {
		    var entity = new DOCJS.ClassEntity([block],
						       block.classs[0],
						       block.param,
						       block.extends[0],
						       block.brief[0],
						       block.desc[0],
						       block.example);
		    lastClass = entity;
		    doc.classes.push(entity);
		}

	    } else if(block.file.length){ // File

	    } else if(block.library.length){ // Library

		entity = new DOCJS.LibraryEntity([block],
						 block.library[0],
						 block.version[0],
						 block.brief[0],
						 block.desc[0]);
		doc.library = entity;

	    } else if(block.func.length){ // Function
		entity = new DOCJS.FunctionEntity([block],
						  block.func[0],
						  block.param,
						  block.ret[0],
						  block.brief[0],
						  block.desc[0],
						  block.example);
		doc.functions.push(entity);

	    } else if(block.method.length){ // Method

		// If we didn't get "memberof" field, assume the class is the last parsed one
		if(block.memberof.length==0 && lastClass)
		    block.memberof.push(new DOCJS.MemberofCommand(block,lastClass.getName()));
		    
		if(block.memberof.length==1){
		    entity = new DOCJS.MethodEntity([block],
						    block.method[0],
						    block.memberof[0],
						    block.param,
						    block.brief[0],
						    block.ret[0]);
		    doc.methods.push(entity);
		}

		
	    } else if(block.property.length){ // Property

		// If we didn't get "memberof" field, assume the class is the last parsed one
		if(block.memberof.length==0 && lastClass)
		    block.memberof.push(new DOCJS.MemberofCommand(block,lastClass.getName()));

		if(block.memberof.length!=1)
		    doc.errors.push(new DOCJS.ErrorReport(block.filename,
						    block.lineNumber,
						    "A @property block requires exactly 1 @memberof command, got "+block.memberof.length+"."));
		else {
		    entity = new DOCJS.PropertyEntity([block],
						      block.property[0],
						      block.memberof[0],
						      block.brief[0],
						      block.desc[0]);
		    doc.properties.push(entity);
		}
	    }
		
	    // Check for todos
	    if(block.todo.length){
		for(var j=0; j<block.todo.length; j++){
		    var todo = new DOCJS.TodoEntity([block],block.todo[j]);
		    doc.todos.push(todo);
		    todo.setEntity(entity);
		}
	    }

	    // Make error for unparsed code
	    var unparsed = block.getUnparsedLines2(true);
	    var count = 0;
	    for (var k in unparsed) {
		if (unparsed.hasOwnProperty(k)){
		    ++count;
		    break;
		}
	    }
	    if(count){
		var message = "There was unparsed code:\n\n";
		for(var j in unparsed){
		    message += "Line "+j+": "+unparsed[j]+"\n";
		}
		doc.errors.push(new DOCJS.ErrorReport(block.filename,
						      block.lineNumber,
						      message));
	    }
	}

	doc.update();

	// Attach methods, properties to their classes
	for(var i=0; i<doc.methods.length; i++){
	    var m = doc.methods[i];
	    var c = doc.nameToClass(m.getClassName());
	    if(c)
		c.addMethod(m);
	    else
		doc.errors.push(new DOCJS.ErrorReport("",1,"Could not add method "+m.getName()+" to the class "+m.getClassName()+", could not find that class."));
	}
	for(var i=0; i<doc.properties.length; i++){
	    var p = doc.properties[i];
	    var c = doc.nameToClass(p.getClassName());
	    if(c)
		c.addProperty(p);
	    else
		doc.errors.push(new DOCJS.ErrorReport("",
						      p.block.lineNumber,
						      "Could not attach property "+p.getName()+" to the class "+p.getClassName()+" because it could not be found."));
	}

	return doc;
    }

    /**
     * @class DOCJS.Command
     * @param DOCJS.Block block
     */
    DOCJS.Command = function(block){
	if(!(block instanceof DOCJS.Block)) throw new Error("Argument block must be instance of Block");
	this.getBlock = function(){ return block; };
	this.setBlock = function(b){ block = b; };
    }

    /**
     * @class DOCJS.AuthorCommand
     * @param DOCJS.Block block
     * @param string content
     * @extends DOCJS.Command
     */
    DOCJS.AuthorCommand = function(block,content){
	DOCJS.Command.call(this,block);
	/**
	 * @method getContent
	 * @return string
	 */
	this.getContent = function(){ return content; };
    }
    /**
     * @function DOCJS.AuthorCommand.parse
     * @param DOCJS.Block block The block that the command was defined in.
     * @param Array errors An array that in case or error will be filled with DOCJS.ErrorReport objects.
     * @return Array
     * @brief Parse an Author command from a block
     */
    DOCJS.AuthorCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];
	    var result = line.match(/@author\s+(.*)$/);
	    if(result && result.length==2){
		var author = new DOCJS.AuthorCommand(block,result[1]);
		block.markLineAsParsed(j);
		commands.push(author);
	    } else if(line.match(/@author/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @author but did not match the command spec \"@author text\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.BriefCommand
     * @param DOCJS.Block block
     * @param string content
     * @extends DOCJS.Command
     */
    DOCJS.BriefCommand = function(block,content){
	DOCJS.Command.call(this,block);
	this.getContent = function(){ return content; };
	this.setContent = function(c){ content=c; };
    }
    /**
     * @function DOCJS.BriefCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.BriefCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @brief briefString
	    var result = line.match(/@brief\s+(.*)$/);
	    if(result && result.length==2){
		var command = new DOCJS.BriefCommand(block,result[1]);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@brief/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @brief but did not match the command spec \"@brief text\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.ClassCommand
     * @param DOCJS.Block block
     * @param string name
     * @extends DOCJS.Command
     */
    DOCJS.ClassCommand = function(block,name){
	DOCJS.Command.call(this,block);
	this.getName = function(){ return name; };
	this.setName = function(n){ name=n; };
    }
    /**
     * @function DOCJS.ClassCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.ClassCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @class ClassNameInOneWord
	    var result = line.match(/@class\s+([^\s]*)$/);
	    if(result && result.length==2){
		var command = new DOCJS.ClassCommand(block,result[1]);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@class/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @class but did not match the command spec \"@class className\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.DescriptionCommand
     * @param DOCJS.Block block
     * @param string content
     * @extends DOCJS.Command
     */
    DOCJS.DescriptionCommand = function(block,content){
	DOCJS.Command.call(this,block);
	this.getContent = function(){ return content; };
	this.setContent = function(n){ content=n; };
    }
    /**
     * @function DOCJS.DescriptionCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     * @todo How to check error on that regexp?
     */
    DOCJS.DescriptionCommand.parse = function(block,errors){
	var commands=[], src = block.getUnparsedLines().join("\n");
	var result = src.match(/((@description)|(@desc))\s+((.(?!@))*)/m)||[]; // anything but not followed by @
	if(result.length>=4 && result[4]!=""){
	    var content = result[4];
	    var command = new DOCJS.DescriptionCommand(block,content);
	    var contentLines = content.split("\n");
	    for(var i=0; i<contentLines.length; i++){
		var n = block.getLineNumber(contentLines[i]);
		block.markLineAsParsed(n);
	    }
	    commands.push(command);
	}
	return commands;
    }

    /**
     * @class DOCJS.EventCommand
     * @param DOCJS.Block block
     * @param string name
     * @param string description
     * @extends DOCJS.Command
     */
    DOCJS.EventCommand = function(block,name,description){
	DOCJS.Command.call(this,block);
	description = description || "";
	this.getName = function(){ return name; };
	this.setName = function(n){ name=n; };
	this.getDescription = function(){ return description; };
	this.setDescription = function(s){ description=s; };
    }
    /**
     * @function DOCJS.EventCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.EventCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];
	    
	    // @event name [description]
	    var result = line.match(/@event\s+([^\s]*)(\s+(.*)){0,1}$/);
	    if(result){
		var name = result[1];
		var desc;
		if(result.length>=3) desc = result[2];
		var command = new DOCJS.EventCommand(block,name,desc);
		block.markLineAsParsed(j);
		commands.push(command);
	   } else if(line.match(/@event/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @event but did not match the command spec \"@event typeName [description]\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.ExampleCommand
     * @param DOCJS.Block block
     * @param string content
     * @extends DOCJS.Command
     */
    DOCJS.ExampleCommand = function(block,content){
	DOCJS.Command.call(this,block);
	this.getContent = function(){ return content; };
    }
    /**
     * @function DOCJS.ExampleCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.ExampleCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines();
	var src = lines.join("\n");
	    
	// @example formattedText @endexample
	var result = src.match(/@example(([\s\S](?!(\\@endexample)))*)@endexample/);
	if(result){
	    var content = result[1];
	    var command = new DOCJS.ExampleCommand(block,content);
	    block.markChunkAsParsed(result[0]);
	    commands.push(command);
	} else if(src.match(/@example/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Block contained @example but did not match the command spec \"@example markupText @endexample\". The input: "+line));
	}
	return commands;
    }

    /**
     * @class DOCJS.ExtendsCommand
     * @param DOCJS.Block block
     * @param string className
     * @extends DOCJS.Command
     */
    DOCJS.ExtendsCommand = function(block,className){
	DOCJS.Command.call(this,block);
	this.getClassName = function(){ return className; };
    }
    /**
     * @function DOCJS.ExtendsCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.ExtendsCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];
	    
	    // @extends className
	    var result = line.match(/@extends\s+([^\s]*)/);
	    if(result){
		var name = result[1];
		var command = new DOCJS.ExtendsCommand(block,name);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@extends/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @extends but did not match the command spec \"@extends className\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.FunctionCommand
     * @param DOCJS.Block block
     * @param string name
     * @param string description
     * @extends DOCJS.Command
     */
    DOCJS.FunctionCommand = function(block,name,description){
	if(typeof(name)!="string") throw new Error("Argument 2 must be string, "+typeof(name)+" given");
	DOCJS.Command.call(this,block);
	this.getName = function(){ return name; }; /// @method getName
	this.setName = function(n){ name=n; };
	this.getDescription = function(){ return description; }; /// @method getDescription
	this.setDescription = function(n){ description=n; };
    }

    /**
     * @function DOCJS.FunctionCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.FunctionCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @[function|fn] name [description]
	    var result = line.match(/((@function)|(@fn))\s+([^\s]+)(\s+(.*))?/);
	    if(result){
		var name = result[4];
		var desc;
		if(result.length>=6) desc = result[6];
		var command = new DOCJS.FunctionCommand(block,name,desc);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/(@function)|(@fn)/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @function or @fn but did not match the command spec \"@function|fn functionName [description]\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @function DOCJS.MemberofCommand
     * @param DOCJS.Block block
     * @param string className
     * @return Array
     */
    DOCJS.MemberofCommand = function(block,className){
	DOCJS.Command.call(this,block);
	this.getClassName = function(){ return className; };
	this.setClassName = function(n){ className=n; };
    }
    /**
     * @function DOCJS.MemberofCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.MemberofCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];
	    // @[memberof|memberOf] ClassName
	    var result = line.match(/(@memberOf)|(@memberof)\s+([^\s]*)$/);
	    if(result && result.length>=4){
		var classname = result[3];
		var command = new DOCJS.MemberofCommand(block,classname);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@member[oO]f/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @memberof but did not match the command spec \"@memberof className\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.LibraryCommand
     * @param DOCJS.Block block
     * @param string libraryName
     */
    DOCJS.LibraryCommand = function(block,libraryName){
	DOCJS.Command.call(this,block);
	this.getName = function(){ return libraryName; };
    }
    /**
     * @function DOCJS.LibraryCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.LibraryCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];
	    // @[library|library] ClassName
	    var result = line.match(/@library\s+(.*)$/);
	    if(result){
		var libname = result[1];
		var command = new DOCJS.LibraryCommand(block,libname);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@library/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @library but did not match the command spec \"@library libraryName\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.MethodCommand
     * @param DOCJS.Block block
     * @param string name
     */
    DOCJS.MethodCommand = function(block,name){
	DOCJS.Command.call(this,block);
	this.getName = function(){ return name; };
	this.setName = function(n){ name=n; };
    }
    /**
     * @function DOCJS.MethodCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.MethodCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @method methodName

	    var result = line.match(/@method\s+([^\s]*)$/);
	    if(result){
		var methodname = result[1];
		var command = new DOCJS.MethodCommand(block,methodname);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@method/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @method but did not match the command spec \"@method methodName\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.PageCommand
     * @param DOCJS.Block block
     * @param string name
     */
    DOCJS.PageCommand = function(block,name){
	DOCJS.Command.call(this,block);
	this.getName = function(){ return name; };
	this.setName = function(n){ name=n; };
    }
    /**
     * @function DOCJS.PageCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.PageCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @page PageTitleString
	    var result = line.match(/@page\s+(.*)$/);
	    if(result){
		var pagename = result[1];
		var command = new DOCJS.PageCommand(block,pagename);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@page/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @page but did not match the command spec \"@page text\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.ParamCommand
     * @param DOCJS.Block block
     * @param string dataType
     * @param string name
     * @param string description
     */
    DOCJS.ParamCommand = function(block,dataType,name,description){
	DOCJS.Command.call(this,block);
	this.getName = function(){ return name; };
	this.getDataType = function(){ return dataType; };
	this.getDescription = function(){ return description ? description : false; };
    }
    /**
     * @function DOCJS.ParamCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.ParamCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

		// @param dataType paramName [paramDescription]
	    var result = line.match(/@param\s+([^\s]*)\s+([^\s]+)(\s+(.*)){0,1}$/);
	    if(result){
		var dataType = result[1],
		paramName = result[2],
		desc;
		if(typeof(result[4])=="string" && result[4]!="") desc = result[4];
		var command = new DOCJS.ParamCommand(block,dataType,paramName,desc);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@param/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @param but did not match the command spec \"@param dataType paramName [description]\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @function DOCJS.PropertyCommand
     * @param DOCJS.Block block
     * @param string dataType
     * @param string name
     * @param string desc
     * @return Array
     */
    DOCJS.PropertyCommand = function(block,datatype,name,desc){
	DOCJS.Command.call(this,block);
	this.getName = function(){ return name; };
	this.setName = function(n){ name=n; };
	this.getDataType = function(){ return datatype; };
    }
    /**
     * @function DOCJS.PropertyCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.PropertyCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @property dataType name [description]
	    var result = line.match(/@property\s+([^\s]*)\s+([^\s]*)\s*(.*){0,1}$/);
	    if(result){
		var dataType = result[1],
		name = result[2],
		desc; // optional
		if(typeof(result[3])=="string" && result[3]!="") desc = result[2];
		var command = new DOCJS.PropertyCommand(block,dataType,name,desc);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@property/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @property but did not match the command spec \"@property dataType propertyName [description]\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.ReturnCommand
     * @param DOCJS.Block block
     * @param string dataType
     * @param string description
     */
    DOCJS.ReturnCommand = function(block,dataType,description){
	DOCJS.Command.call(this,block);
	this.getDescription = function(){ return description; };
	this.setDescription = function(n){ description=n; };
	this.getDataType = function(){ return dataType; };
	this.setDataType = function(n){ dataType=n; };
    }
    /**
     * @function DOCJS.ReturnCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.ReturnCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @return dataType [description]
	    var result = line.match(/@return[s]{0,1}\s+([^\s]*)\s*(.*){0,1}$/);
	    if(result){
		var dataType = result[1],
		name = result[2],
		desc; // optional
		if(typeof(result[3])=="string" && result[3]!="") desc = result[2];
		var command = new DOCJS.ReturnCommand(block,dataType,name,desc);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@return[s]{0,1}/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @return but did not match the command spec \"@return dataType [description]\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.SeeCommand
     * @param DOCJS.Block block
     * @param string text
     */
    DOCJS.SeeCommand = function(block,text){
	DOCJS.Command.call(this,block);
	this.getText = function(){ return text; };
	this.setText = function(n){ text=n; };
    }
    /**
     * @function DOCJS.SeeCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.SeeCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];
	    
	    // @see text
	    var result = line.match(/@see\s+(.*)$/);
	    if(result){
		var text = result[1];
		var command = new DOCJS.SeeCommand(block,text);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@see/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @see but did not match the command spec \"@see text\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.TodoCommand
     * @param DOCJS.Block block
     * @param string content
     * @extends DOCJS.Command
     */
    DOCJS.TodoCommand = function(block,content){
	DOCJS.Command.call(this,block);
	this.getContent = function(){ return content; };
	this.setContent = function(n){ content=n; };
    }

    /**
     * @function DOCJS.TodoCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.TodoCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @todo [text]
	    var result = line.match(/@todo(\s+(.*))$/);
	    if(result){
		var text = result[1];
		var command = new DOCJS.TodoCommand(block,text);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@todo/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @todo but did not match the command spec \"@todo text\". The input: "+line));
	    }
	}
	return commands;
    }

    /**
     * @class DOCJS.VersionCommand
     * @param DOCJS.Block block
     * @param string content
     * @extends DOCJS.Command
     */
    DOCJS.VersionCommand = function(block,content){
	DOCJS.Command.call(this,block);
	this.getContent = function(){ return content; }; /// @method getContent
    }

    /**
     * @function DOCJS.VersionCommand.parse
     * @param DOCJS.Block block
     * @param Array errors
     * @return Array
     */
    DOCJS.VersionCommand.parse = function(block,errors){
	var commands = [], lines = block.getUnparsedLines2();
	for(var j in lines){
	    var line = lines[j];

	    // @version text
	    var result = line.match(/@version\s+(.*)$/);
	    if(result){
		var text = result[1];
		var command = new DOCJS.VersionCommand(block,text);
		block.markLineAsParsed(j);
		commands.push(command);
	    } else if(line.match(/@version/)){
		errors.push(new DOCJS.ErrorReport(block.filename,
						  block.localToGlobalLineNumber(j),
						  "Line contained @version but did not match the command spec \"@version text\". The input: "+line));
	    }
	}
	return commands;
    }

    // Parse blocks from a file
    function parseBlocks(src,file,errors){
	var blockObjects = [];
	// (.(?!\*\/))* is negative lookahead, anything not followed by */
	var blocks = src.match(/\/\*\*\n(^(.(?!\*\/))*\n)+[\n\s\t]*\*\//gm) || [];
	var oneLineBlocks = src.match(/\/\/\/(.*)/g);
	for(var i=0; oneLineBlocks && i<oneLineBlocks.length; i++)
	    blocks.push(oneLineBlocks[i]);
	for(var i=0; i<blocks.length; i++){

	    // find line number
	    var idx = src.indexOf(blocks[i]);
	    var lineNumber = (src.substr(0,idx).match(/\n/g)||[]).length + 1;

	    var raw = blocks[i]+"";

	    // remove first and last slash-stars
	    blocks[i] = blocks[i]
		.replace(/\/\*\*[\n\t\r]*/,"")
		.replace(/[\n\t\r]*\*\/$/,"");

	    // Remove starting star and one space
	    var lines = blocks[i].split("\n");
	    for(var j=0; j<lines.length; j++)
		lines[j] = lines[j].replace(/^[\s\t]*\*\s{0,1}/,"");

	    // Create block
	    var block = new DOCJS.Block(lines.join("\n").replace(/[\n\s\t]*$/,""),raw,lineNumber);
	    block.filename = file;

	    // Parse commands from block
	    block.author =   DOCJS.AuthorCommand.parse(block,errors);
	    block.brief =    DOCJS.BriefCommand.parse(block,errors);
	    block.classs =   DOCJS.ClassCommand.parse(block,errors);
	    block.desc =     DOCJS.DescriptionCommand.parse(block,errors);
	    block.event =    DOCJS.EventCommand.parse(block,errors);
	    block.example=   DOCJS.ExampleCommand.parse(block,errors);
	    block.extends=   DOCJS.ExtendsCommand.parse(block,errors);
	    block.func =     DOCJS.FunctionCommand.parse(block,errors);
	    block.library =  DOCJS.LibraryCommand.parse(block,errors);
	    block.memberof = DOCJS.MemberofCommand.parse(block,errors);
	    block.method =   DOCJS.MethodCommand.parse(block,errors);
	    block.page =     DOCJS.PageCommand.parse(block,errors);
	    block.param =    DOCJS.ParamCommand.parse(block,errors);
	    block.property = DOCJS.PropertyCommand.parse(block,errors);
	    block.ret =      DOCJS.ReturnCommand.parse(block,errors);
	    block.see =      DOCJS.SeeCommand.parse(block,errors);
	    block.todo =     DOCJS.TodoCommand.parse(block,errors);
	    block.version =  DOCJS.VersionCommand.parse(block,errors);

	    blockObjects.push(block);
	}

	// Sort by their position in the code
	blockObjects.sort(function(b1,b2){
	    return b1.lineNumber - b2.lineNumber;
	});
	return blockObjects;
    };

    function loadBlocks(urls,callback){
	// Get the files
	var numLoaded = 0;
	var errors = [];
	var blocks = [];
	if(!options.fileLoader)
	    options.fileLoader = new DOCJS.AjaxFileLoader();
	for(var i=0; i<urls.length; i++){
	    (function(url){
		options.fileLoader.load(url,function(err,content){
		    numLoaded++;
		    if(!err){
			blocks = parseBlocks(content,url,errors);
			if(numLoaded==urls.length)
			    callback(blocks,errors);
		    } else {
			errors.push(err);
			if(numLoaded==urls.length)
			    callback(blocks,errors);
		    }
		});
	    })(urls[i]);
	}
    }
};

