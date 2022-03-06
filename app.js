var s = script.Load("sql", "exec", "query", "insert", "addLeadingZeroes");

//insertOrders([17455, 17456, 17848, 17492], 'Printed')
var colorEnd = "</color>";
var size = "<size 20>";
var sizeS = "<size 19>";
var kitchenSize = "<size 23>";
var sizeEnd = "</size>";
var newLine = "<br/>";
var tab = "   ";
var fillLine = "__________________________________________" + newLine;


function getTextColor(textType) {
	switch (textType) {
		case "ALLERGY":
			return "<color red>";
		case "Nigiri":
			return "<color #28ddfc>";
		case "Special Nigiri":
			return "<color #28ddfc>";
		case "Sashimi":
			return "<color #45fffc>";
		case "Salad":
			return "<color #a1e1ed>";
		case "Sashimi Piece":
			return "<color #a1e1ed>";
		case "STAY":
			return "<color #f5e642>";
		case "TAKE":
			return "<color #f05dbf>";
		case "bgdata":
			return "<color #7E7E7E>";
		case "Number":
			return "<color #ffffff>";
		case "Comment":
			return "<color #fca503>";
		case "Hidden":
			return "<color #3f3f3F>";
		case "Hidden Number":
			return "<color #3e3e3e>";
		case "Displayed Number":
			return "<color #fffffe>";
		case "Displayed":
			return "<color #45fffc>";
		case "Displayed Comment":
			return "<color #fca505>";
		case "Hidden Comment":
			return "<color #3d3d3d>";
		case "Drink":
			return "<color #8cf5d7>";
		case "Bowls":
			return "<color #fff5ba>";
		case "RegOshi":
			return "<color #03fc41>";
		case "WAITING":
			return "<color #6fff00>";
		default:
			return "<color white>";
	}
}

function insertOrders(ticketNumbers, printState) {
	var areNewTickets = true;
	for (i in printState) {
		if (printState[i] == "Printed" || printState[i] == "Ready")
			areNewTickets = false;
	}
	if (!(ticketNumbers instanceof Array))
		ticketNumbers = [ticketNumbers];
	var getEndDate = function (time, section, iteration, maxIterations) {
		if (displayData[section] == undefined)
			return time;
		if (time > displayData[section][0])
			return time;
		if (displayData[section][1] == undefined) {
			displayData[section][1] = new Date(displayData[section][0].getTime()).setMinutes(displayData[section][0].getMinutes() + 1);
		}
		var difference = Math.abs(displayData[section][0] - displayData[section][1]) / (maxIterations + 1);
		var returnTime = new Date(displayData[section][1] + difference * (iteration + 1));
		return returnTime;
	}
	var data = getData(ticketNumbers, printState);
	if (!data)
		return false;
	var printData = makePrintString(data);
	//return JSON.stringify(printData, undefined, 2);
	if (!printData)
		return false;
	var displayData = getDisplayData();
	var table = "Tasks";
	var columns = "TaskTypeId,StartDate,EndDate,CreatedDate,LastUpdateTime,Completed,UserName,Identifier,Content,CustomData,Name".split(",");
	var values = new Array();
	var updateContent = new Array();
	var kdsOrders = false;
	var sdsOrders = false;
	var ddsOrders = false;
	var sdsPriceTotal = 0.0;
	for (i in printData) {
		if (printData[i].sections.sections.search("S") != -1)
			sdsOrders = true;
		if (printData[i].sections.sections.search("K") != -1)
			kdsOrders = true;
		if (printData[i].sections.sections.search("D") != -1)
			ddsOrders = true;

		for (j in printData[i].sections) {
			if (j == "sections")
				continue;
			//if(
			var taskTypeId = printData[i].sections[j].taskId;
			var user = printData[i].user;
			var endDate = new Date();
			var name = getTaskName(data[i].ticketData);
			var identifier = data[i].ticketData.number;


			var getTaskValues = function (isDelay) {
				var partName = "order";
				if (isDelay)
					partName = "delay";
				var customData = {
					ids: printData[i].sections[j][partName + "Ids"],
					price: printData[i].sections[j][partName + "Price"],
					sections: printData[i].sections.sections
				};
				var content = "";
				if (!printData[i].sections[j].parent) {
					content += printData[i].ticketString[0].replace("~~~~", Math.round(printData[i].sections[j][partName + "Price"]));
					if (j == "S")
						sdsPriceTotal += printData[i].sections[j][partName + "Price"];
					if (j == "K")
						content += printData[i].ticketString[1];
					content += fillLine;
				}
				content += printData[i].sections[j][partName + "String"];
				var sectionId = printData[i].sections[j].taskId;
				if (printData[i].sections[j].parent)
					sectionId = printData[i].sections[j].parent;
				if (j == "K" && printData[i].sections[j]["orderPrice"] == 0 && ddsOrders) {
					taskTypeId = 9;
					content = content.replace(new RegExp(getTextColor("Hidden"), 'g'), getTextColor("Displayed")).replace(new RegExp(getTextColor("Hidden Number"), 'g'), getTextColor("Displayed Number")).replace(new RegExp(getTextColor("Displayed Comment"), 'g'), getTextColor("Displayed Comment"));
				}
				endDate = getEndDate(endDate, sectionId, i, printData.length);
				if(data[i].ticketData.time){
					customData.fulfillAt = data[i].ticketData.time;
				} else {
					customData.fulfillAt = convertTicketTime(endDate);
				}
				var values = [taskTypeId, new Date(), endDate, new Date(), new Date(), 0, user, name, content, JSON.stringify(customData), identifier];
				return values;
			}



			if (data[i].ticketData.ticketTypeGroup == "STAY") {
				endDate.setMinutes(endDate.getMinutes() + 5);
				if (j == "S" && printData[i].sections.search("K") != -1) {
					if (printData[i].sections["K"].price > 20)
						endDate.setMinutes(endDate.getMinutes() + 8);
				}
			}
			else {
				var time = data[i].ticketData.time.split(":");
				endDate.setHours(time[0]);
				endDate.setMinutes(time[1]);
			}


			if (printData[i].sections[j].delayString) {
				var isDelay = true;
				values.push(getTaskValues(isDelay));
				endDate.setMinutes(endDate.getMinutes() + 8);
			}


			var isDelay = false;
			values.push(getTaskValues(isDelay));
			//[taskTypeId,now,endDate,now,now,0,user,name,content,JSON.stringify(customData)];
		}
	}
	values = splitDuplicateTasks(values, areNewTickets);

	if (values.insert.length > 0) {
		var insertObj = {
			table: table,
			columns: columns,
			values: values.insert
		};

		//file.AppendToFile('C:\\SambaPOS5\\SQLExecErrorLog.txt', "\r\n\r\n" + JSON.stringify(insertObj, undefined, 2));
		//return;// JSON.stringify(insertObj, undefined, 2);
		s.insert(insertObj)	
	}	
	if (values.update.tasks.length > 0) {	
		for (i in values.update.tasks) {	
			updateDisplay(values.update.tasks[i]);	
		}	
		sdsPriceTotal += values.update.price;	
	}	
	updateSDSOrderPriceTotals(sdsPriceTotal);	
	var sentOrders = {	
		K: kdsOrders,	
		S: sdsOrders,	
		D: ddsOrders	
	};	
	return sentOrders;//JSON.stringify(values, undefined, 2);
}
/*
	Insert Data Object Format
	insertData = {
		table: "ProgramSettingValues",
		columns : ["Value","Name"],
		values: [
			["test","test2"],
			["test3","test4"],
			["test5","test6"]
			]
		};
	*/

function getDisplayIdentifiers(identifiers) {
	var qry = "SELECT Identifier, TaskTypeId, CustomData, Id FROM Tasks WHERE Completed = 0 AND Identifier IN (" + identifiers.toString() + ")";
	return s.query(qry);
}

function splitDuplicateTasks(values, areNewTickets) {
	var update = { price: 0, tasks: [] };
	var insertTasks = new Array();
	if (areNewTickets)
		insertTasks = values;
	else {
		var identifiers = [];
		for (i in values)
			identifiers.push("'" + values[i][10] + "'");
		var displayIdentifiers = getDisplayIdentifiers(identifiers);

		for (i in values) {
			var duplicateIndex = -1;
			for (j in displayIdentifiers) {
				if (values[i][0] == displayIdentifiers[j][1] && values[i][10] == displayIdentifiers[j][0]) {
					duplicateIndex = j;
					break;
				}
			}
			if (duplicateIndex != -1) {
				update.tasks.push({ taskId: displayIdentifiers[duplicateIndex][3], content: values[i][8], customData: values[i][9] });
				if (displayIdentifiers[duplicateIndex][1] == 6)
					update.price += parseFloat(JSON.parse(values[i][9]).price) - parseFloat(JSON.parse(displayIdentifiers[duplicateIndex][2]).price);
			}
			else
				insertTasks.push(values[i]);
		}
	}
	return { insert: insertTasks, update: update };
}

function updateDisplay(task) {
	var qry = "UPDATE Tasks SET Content = '" + updateContent(task.content) + "', "
		+ "CustomData = '" + task.customData + "', "
		+ "LastUpdateTime = CURRENT_TIMESTAMP "
		+ "WHERE Id = " + task.taskId + " ";
	return s.exec(qry);
}


function updateContent(content) {
	content += newLine + getTextColor("ALLERGY") + size + "<bold>UPDATED</bold>" + sizeEnd + colorEnd;
	return content.replace(/'/g, "''");
}


function getDisplayData() {
	var qry = "SELECT b.Enddate, b.TaskTypeId, arn "
		+ "FROM (SELECT a.Enddate as Enddate, a.TaskTypeId as TaskTypeId, ROW_NUMBER() OVER (Partition by TaskTypeId order by Enddate DESC) as rn, arn "
		+ "FROM ( "
		+ "SELECT FORMAT(Enddate, 'yyyy,MM,dd,HH,mm,ss,fff') as Enddate, TaskTypeId, ROW_NUMBER() OVER(partition by TaskTypeId order by EndDate ASC) as arn "
		+ "FROM [SambaPOS5].[dbo].[Tasks]  "
		+ "WHERE [Completed] = 0  "
		+ "AND TaskTypeId IN (SELECT Id From TaskTypes WHERE SubOf IS NULL AND Name like '_DSTask')  "
		+ ") a "
		+ "WHERE arn <= 15) b "
		+ "WHERE b.rn in (1,2) ";
	//dlg.ShowMessage(qry);
	var data = s.query(qry);
	var displayData = {};

	for (i in data) {
		var displayId = data[i][1];
		if (i == 0 || data[i][1] != data[i - 1][1])
			displayData[displayId] = new Array();
		else {
			if (data[i - 1][2] != 15)
				continue;
		}
		var time = data[i][0].split(",");
		for (j in time) {
			while (time[j].charAt(0) == "0" && time[j].length > 1) {
				time[j] = time[j].substr(1);
			}
			time[j] = parseInt(time[j]);
		}
		displayData[displayId].push(new Date(time[0], time[1] - 1, time[2], time[3], time[4], time[5], time[6]));
	}
	return displayData;//JSON.stringify(displayData, undefined, 2);
}


function getData(ticketNumbers, printStates) {
	printStates = makePrintStateArray(printStates);
	var qry = "SELECT Orders.Id as OrderId, "
		+ "(CASE WHEN MenuItems.Tag IS NULL THEN 999 ELSE MenuItems.Tag END) as PrintOrder, "
		+ "Orders.Quantity, "
		+ "Orders.Price,  "
		+ "MenuItems.GroupCode, "
		+ "DisplayName.tagValue as DisplayName, "
		+ "Orders.PortionName, "
		+ "Orders.OrderTags,  "
		+ "seatNum.stateValue as seatNum, "
		+ "sections.tagValue,  "
		+ "Tickets.Id, "
		+ "Tickets.TicketTypeId,  "
		+ "TicketEntities.EntityTypeId,  "
		+ "(CASE "
		+ "WHEN TicketEntities.EntityTypeId IN (1, 2) THEN TicketEntities.EntityName "
		+ "ELSE customData.dataValue "
		+ "END),  "
		+ "(CASE WHEN TicketTypes.PrintName = 'TAKE' THEN pickupTime.tagValue ELSE NULL END) as PickupTime, "
		+ "TicketTypes.Name, "
		+ "TicketTypes.PrintName,  "
		+ "rw.tagValue, "
		+ "Tickets.LastModifiedUserName "
		+ "FROM [SambaPOS5].[dbo].[Orders] "
		+ "INNER JOIN [SambaPOS5].[dbo].[MenuItems] ON Orders.MenuItemId = MenuItems.Id "
		+ "INNER JOIN [SambaPOS5].[dbo].[Tickets] on Orders.TicketId = Tickets.Id  "
		+ "INNER JOIN TicketEntities ON Tickets.Id = Ticket_Id  "
		+ "INNER JOIN TicketTypes ON TicketTypeId = TicketTypes.Id  "
		+ "CROSS APPLY OPENJSON(Tickets.TicketTags) WITH( 	tagName varchar(20) '$.TN', tagValue varchar(20) '$.TV') pickupTime "
		+ "CROSS APPLY OPENJSON([Orders].[OrderStates]) WITH ( stateName varchar(20) '$.SN', stateValue varchar(20) '$.S') seatNum "
		+ "CROSS APPLY OPENJSON([Orders].[OrderStates]) WITH ( stateName varchar(20) '$.SN', stateValue varchar(20) '$.S') printState  "
		+ "CROSS APPLY OPENJSON([MenuItems].[CustomTags]) WITH ( tagName varchar(20) '$.TN', tagValue varchar(20) '$.TV') sections "
		+ "CROSS APPLY OPENJSON([MenuItems].[CustomTags]) WITH ( tagName varchar(20) '$.TN', tagValue varchar(20) '$.TV') DisplayName "
		+ "CROSS APPLY OPENJSON(TicketEntities.EntityCustomData) WITH( dataName varchar(20) '$.Name', dataValue varchar(40) '$.Value') customData "
		+ "CROSS APPLY OPENJSON(Tickets.TicketTags) WITH( 	tagName varchar(20) '$.TN', tagValue varchar(20) '$.TV') rw "
		+ "WHERE (printState.stateName = 'DStatus' AND printState.stateValue IN (" + printStates.toString() + "))  "//(OrderStates like '%Done%' OR OrderStates like '%Ready%') and printState.stateName = 'SeatNum' "
		+ "AND OrderStates NOT LIKE '%\"Void\"%'  "
		+ "AND seatNum.stateName = 'SeatNum' "
		+ "AND sections.tagName = 'Sections' "
		+ "AND DisplayName.tagName =  'DisplayName' "
		+ "AND pickupTime.tagName = CASE WHEN TicketTypes.PrintName = 'TAKE' THEN 'Pickup Time' ELSE '# of Seats' END  "
		+ "AND EntityTypeId = (CASE WHEN Tickets.TicketTypeId = 1 THEN 2 ELSE EntityTypeId END) "
		+ "AND customData.dataName LIKE (CASE WHEN EntityTypeId = 1 THEN 'First%Name' ELSE 'Display' END) "
		+ "AND rw.TagName = CASE WHEN Tickets.TicketTags LIKE '%OrderState%' THEN 'OrderState' ELSE '# of Seats' END "
		+ "AND TicketNumber IN (" + ticketNumbers.toString() + ") "
		+ "ORDER BY TicketNumber, seatNum, PrintOrder";

	var data = s.query(qry);
	if (data) {
		var returnData = new Array();
		var processedTickets = -1;
		var ordersPerTicket = 0;
		for (var i = 0; i < data.length; i++) {
			if (i == 0 || data[i][10] != data[i - 1][10]) {
				processedTickets++;
				ordersPerTicket = 0;
				returnData[processedTickets] = {
					sections: "",
					length: 0,
					orders: new Array(),
					ticketData: {
						id: data[0][10],
						number: ticketNumbers[processedTickets],
						ticketTypeId: data[i][11],
						entityTypeId: data[i][12],
						entityName: data[i][13],
						ticketType: data[i][15],
						ticketTypeGroup: data[i][16],
						isWaiting: String(data[i][17]).search("W") != -1,
						isRush: String(data[i][17]).search("R") != -1,
						user: data[i][18]
					}
				};
				if (data[0][16] == "TAKE")
					returnData[processedTickets].ticketData.time = data[0][14];
			}

			returnData[processedTickets].orders[ordersPerTicket] = {
				id: data[i][0],
				printOrder: data[i][1],
				quantity: parseFloat(Helper.Format(data[i][2])),
				price: parseFloat(data[i][3]),
				groupCode: data[i][4],
				printName: data[i][5],
				portion: data[i][6],
				orderTags: processOrderTags(data[i][7]),
				seat: data[i][8],
				section: data[i][9]
			}

			for (var j = 0; j < returnData[processedTickets].orders[ordersPerTicket].section.length; j++) {
				if (returnData[processedTickets].sections.search(returnData[processedTickets].orders[ordersPerTicket].section[j]) == -1)
					returnData[processedTickets].sections += returnData[processedTickets].orders[ordersPerTicket].section[j];
			}
			returnData[processedTickets].length++;
			ordersPerTicket++;

		}
		return returnData;
	}
	//file.AppendToFile('C:\\SambaPOS5\\SQLExecErrorLog.txt', qry);
	return data;
}


function makePrintStateArray(printStates) {
	if (!(printStates instanceof Array))
		printStates = [printStates];
	for (i in printStates)
		printStates[i] = "'" + printStates[i] + "'";
	return printStates;
}


function processOrderTags(tags) {
	if (tags) {
		tags = JSON.parse(tags);
		var processedTags = new Array();
		for (i in tags) {
			processedTags[i] = {
				price: 0.0,
				quantity: parseFloat(Helper.Format(tags[i].Q)),
				tag: tags[i].TV
			}
			if (tags[i].PR)
				processedTags[i].price += parseFloat(tags[i].PR);
		}
		return processedTags;
	}
	else return;
}


function makePrintString(data) {
	var returnData = new Array();
	for (var i in data) {
		var subData = {
			ticketString: makeTicketString(data[i].ticketData),
			user: data[i].ticketData.user
		};
		subData.sections = makeOrderString(data[i]);
		returnData[i] = subData;
	}

	return returnData;
}


function makeTicketString(ticketData) {
	var returnString = new Array();
	returnString.push("");
	returnString[0] += sizeS + getTextColor(ticketData.ticketTypeGroup) + "<bold>" + ticketData.ticketTypeGroup + "</bold>" + colorEnd + " - ";
	if (ticketData.ticketTypeGroup == "STAY")
		returnString[0] += getTextColor("bgdata") + ticketData.entityName + colorEnd;
	else {
		returnString[0] += getTextColor(" ") + convertTicketTime(ticketData.time) + colorEnd;
		if (ticketData.isWaiting && !ticketData.isRush)
			returnString[0] += " - " + getTextColor("WAITING") + "WAITING" + colorEnd;
		returnString[1] = getTextColor("Hidden");
		if (ticketData.ticketType == "Delivery Ticket")
			returnString[1] += "D -";
		returnString[1] += ticketData.entityName + colorEnd + newLine;
	}
	if (ticketData.isRush)
		returnString[0] += " - " + getTextColor("ALLERGY") + "<bold>RUSH!</bold>" + colorEnd;
	returnString[0] += sizeEnd + newLine;
	returnString[0] += sizeS + getTextColor("bgdata") + ticketData.user + "--$~~~~" + colorEnd + sizeEnd + newLine;
	return returnString;
}

function convertTicketTime(time) {
	if(time instanceof Date){
		time = time.getHours() + ":" + time.getMinutes();
	}
	time = time.split(":");
	if (time[0] > 12)
		time[0] = time[0] - 12;
	return time[0] + ":" + time[1];

}





function makeOrderString(data) {
	var printStringBySections = { sections: "" };
	var seatString = "";
	var allSectionsString = "";
	var allSectionsPrice = 0.0;
	var allSectionsOrderId = new Array();
	var seatUpdated = false;

	console.log(data);
	var displays = getDisplayTaskData();
	var noSection = getNonExistantSections(data.sections, displays);


	var insertIntoPrintStringBySections = function (section, orderString, price, id) {
		if (printStringBySections[section] == undefined) {
			var taskId = 0;
			var parent;
			for (var i in displays) {
				if (displays[i].name.charAt(0) == section) {
					taskId = i;
					parent = displays[i].parent;
					break;
				}
			}
			printStringBySections[section] = {
				taskId: taskId
			};
			if (parent)
				printStringBySections[section].parent = parent;
			printStringBySections.sections += section;
		}
		if (printStringBySections[section].orderString == undefined) {
			printStringBySections[section].orderString = seatString + allSectionsString;
			printStringBySections[section].orderPrice = allSectionsPrice;
			if (id) {
				printStringBySections[section].orderIds = new Array()
				printStringBySections[section].orderIds = printStringBySections[section].orderIds.concat(allSectionsOrderId);
			}
		}
		else {
			if (seatUpdated) {
				printStringBySections[section].orderString += seatString;
			}
		}
		printStringBySections[section].orderString += orderString;
		printStringBySections[section].orderPrice += price;
		if (id)
			printStringBySections[section].orderIds.push(id);
	}

	for (var i = 0; i < data.orders.length; i++) {
		var orderString = size;
		var price = 0.0;
		seatUpdated = false;


		if (i == 0 || data.orders[i].seat != data.orders[i - 1].seat) {
			seatString = "------" + data.orders[i].seat + "------" + newLine;
			allSectionsString = "";
			allSectionsPrice = 0.0;
			allSectionsOrderId = new Array();
			seatUpdated = true;
		}

		if (data.orders[i].groupCode != "ALLERGY") orderString += getTextColor("Number") + data.orders[i].quantity + colorEnd + " ";
		orderString += getTextColor(data.orders[i].groupCode) + data.orders[i].printName;
		if (data.orders[i].portion != "Normal") orderString += " " + data.orders[i].portion;
		if (data.orders[i].section.search("R") != -1 || data.orders[i].section.search("O") != -1) {
			if (data.orders[i].section.search("H") != -1)
				orderString += " " + colorEnd + getTextColor("Sashimi") + "Sas";
			if (data.orders[i].section.search("N") != -1)
				orderString += " " + colorEnd + getTextColor("Sashimi") + "Nigi";
		}
		orderString += colorEnd + sizeEnd + newLine;
		price += data.orders[i].price;
		if (data.orders[i].orderTags != undefined) {
			for (j in data.orders[i].orderTags) {
				if (data.orders[i].orderTags[j].tag.search("Instruction") != -1)
					continue;
				orderString += tab + sizeS;
				if (searchTag(data.orders[i].orderTags[j].tag, "TEST"))
					orderString += "<color red><bold>TEST</bold>"
				else
					orderString += getTextColor("Comment") + (data.orders[i].orderTags[j].quantity == 1 ? " " : data.orders[i].orderTags[j].quantity) + " " + data.orders[i].orderTags[j].tag;
				orderString += colorEnd + sizeEnd + newLine;
				price += data.orders[i].orderTags[j].price * data.orders[i].orderTags[j].quantity;
				if (data.orders[i].section.search("K") == -1 && (searchTag(data.orders[i].orderTags[j].tag, "YTR") || searchTag(data.orders[i].orderTags[j].tag, "YAM") || searchTag(data.orders[i].orderTags[j].tag, "YRA"))) {
					var kOrderString = kitchenSize + getTextColor("Displayed") + (data.orders[i].orderTags[j].quantity * data.orders[i].quantity) + " " + data.orders[i].orderTags[j].tag + colorEnd + sizeEnd + newLine;
					insertIntoPrintStringBySections("K", kOrderString, 0.0);
				}
			}

		}

		price *= data.orders[i].quantity;

		for (var j = 0; j < data.orders[i].section.length; j++) {
			var skipIteration = false;
			var currentSection = data.orders[i].section[j];
			for (var k = 0; k < noSection.length; k++) {
				if (currentSection == noSection[k]) {
					skipIteration = true;
				}
			}
			if (skipIteration) break;
			if (data.orders[i].section.search("A") != -1) {
				for (var k = 0; k < printStringBySections.sections.length; k++)
					insertIntoPrintStringBySections(printStringBySections.sections[k], orderString, price, data.orders[i].id);
				allSectionsString += orderString;
				allSectionsPrice += price;
				allSectionsOrderId.push(data.orders[i].id);
				break;
			} else if (currentSection == "H") {
				insertIntoPrintStringBySections("N", orderString, price, data.orders[i].id);
				continue;
			} else if (currentSection == "K") {
				var kOrderString = orderString.replace(new RegExp(size, 'g'), kitchenSize);
				var kPrice = price;
				if (data.orders[i].section.search("S") != -1) {
					kOrderString = KorderString.replace(new RegExp(getTextColor(data.orders[i].groupCode), 'g'), getTextColor("Displayed")).replace(new RegExp(getTextColor("Number"), 'g'), getTextColor("Displayed Number"));
					kPrice = 0;
					if (data.orders[i].tags != undefined)
						kOrderString = KorderString.replace(new RegExp(getTextColor("Comment"), 'g'), getTextColor("Displayed Comment"));
				}
				insertIntoPrintStringBySections(currentSection, kOrderString, kPrice);
				continue;
			}
			if (currentSection == "D" && data.ticketData.ticketTypeGroup == "TAKE") {
				var DorderString = orderString.replace(new RegExp(getTextColor(data.orders[i].groupCode), 'g'), getTextColor("Hidden")).replace(new RegExp(getTextColor("Number"), 'g'), getTextColor("Hidden Number"));
				if (data.orders[i].tags != undefined)
					DorderString = DorderString.replace(new RegExp(getTextColor("Comment"), 'g'), getTextColor("Hidden Comment"));
				insertIntoPrintStringBySections("K", DorderString, 0.0);
			}
			insertIntoPrintStringBySections(currentSection, orderString, price, data.orders[i].id);
		}
	}
	//file.AppendToFile('C:\\SambaPOS5\\SQLExecErrorLog.txt', "\r\n\r\n" + JSON.stringify(printStringBySections, undefined, 2));
	return printStringBySections;
}

function getNonExistantSections(sections, displays) {
	var noSection = "";
	for (var i = 0; i < sections.length; i++) {
		var exists = false
		for (j in displays) {
			if (sections[i] == "A" || sections[i] == "H" || sections[i] == displays[j].name.charAt(0)) {
				exists = true;
				break;
			}
		}
		if (!exists)
			noSection += sections[i];
	}
	return noSection;
}

function searchTag(tag, searchTerm) {
	tag = tag.toUpperCase();
	searchTerm = searchTerm.toUpperCase();
	if (tag.search(searchTerm) != -1)
		return true;
	if (tag.search(searchTerm[0] + "." + searchTerm[1] + "." + searchTerm[2]) != -1)
		return true;
	return false;
}

function getDisplayTaskData() {
	var qry = "SELECT [Id], "
		+ "[Name], "
		+ "[SubOf] "
		+ "FROM [SambaPOS5].[dbo].[TaskTypes] "
		+ "WHERE Name LIKE '_DSTask'";
	//var data = s.query(qry);
	data = [
		[
			"5",
			"KDSTask",
			""
		],
		[
			"6",
			"SDSTask",
			""
		],
		[
			"10",
			"RDSTask",
			"6"
		],
		[
			"13",
			"ODSTask",
			"6"
		],
		[
			"14",
			"NDSTask",
			"6"
		],
		[
			"15",
			"DDSTask",
			""
		]
	];
	var displayData = {};
	for (i in data) {
		displayData[data[i][0]] = {
			name: data[i][1],
			parent: data[i][2] == "" ? false : data[i][2]
		};
	}
	return displayData;
}


function getTaskName(ticketData) {
	if (ticketData.ticketTypeGroup == "STAY")
		return ticketData.entityName;
	return addLeadingZeroes(ticketData.number % 1000);
}

function updateSDSOrderPriceTotals(price) {
	var qry = "UPDATE [SambaPOS5].[dbo].[ProgramSettingValues] "
		+ "SET [Value] = CAST([Value] AS float) + " + price
		+ " WHERE Id = 50";
	return s.exec(qry);
}

function addLeadingZeroes(number) {
	number = number + "";
	while (number.length < 3)
		number = "0" + number;
	return number;
}

function sortDisplayedOrderByTime(display){
	var taskType = 5;
	if(display == "S") taskType = 6;
	else if(display == "All") taskType = "5, 6";
	var qry = `SELECT CustomData, EndDate, Id
			FROM Tasks
			WHERE TaskTypeId IN (${taskType})
			AND Completed = 0`;
	var tasks = s.query(qry);
	if(!tasks) return;
	var sortedTasks = [];
	for(var i in tasks){
		var data = JSON.parse(tasks[i][0]);
		var endDate = tasks[i][1].split(":");
		var id = tasks[i][2];
		var actualTime = data.fulfillAt.split(":");
		endDate[0] = endDate[0].split(" ");
		endDate[0][1] = actualTime[0];
		endDate[0] = endDate[0].join(" ");
		endDate[1] = actualTime[1];
		endDate = endDate.join(":");
		qry = `UPDATE Tasks SET EndDate = CAST('${endDate}' as datetime) WHERE Id =${id}`;
		s.exec(qry);
	}
}