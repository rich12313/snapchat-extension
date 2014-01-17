//Very bad global variables. Whatever, I wanted to minimize the Chrome.Storage() calls and this was the easiest way to do it.
var App_Snapchat_Username = "-1";
var App_Snapchat_Password = "-1";
var App_Snapchat_Image_URL = "-1";
//=======================================================================
//Grabbing the username and password from local storage
//Should be set in options.html page before user trys the app
function chrome_storage_get(){
	chrome.storage.local.get(null, function(result){
		console.log("Getting values..."+result.snapchat_password);
		App_Snapchat_Username = result.snapchat_username;
		App_Snapchat_Password = result.snapchat_password;
	});
}
//========================================================================
//Call this after the friends list is loaded into the DOM.
//Watched the checkbox list and adds/removes names to the recipient list as the user makes decisions
function listen_for_change(){
	$('input[type=checkbox]').change(
					function(){
						if (this.checked) {
							$("#snapchat_recipient_list").append('<li id="'+this.id+'"value="'+this.value+'">'+this.name+'</li>');
							
						}
						else{
							$('#snapchat_recipient_list > li#'+this.id).remove();
							console.log("Removed "+this.id);
							
						}
					});
}
//========================================================================
//As the friends list is being populated, this checks to make sure a display name actually exists. 
//Snapchat does not force the user to enter a display name, so if there is no display name, it displays the username
//This mirrors that functionality and provides a hover link telling the user to set a display name in the Offical Snapchat App
function name_checker(name){
	if (!name){
	name = "<a id='no_display_name' class='underline' title='There is no display name for this contact. Go to Snapchat App to change.'>NDN</a>";
	}
	
	return name;
}
//========================================================================
//Takes the friends array object and dynamically created a checkbox list then adds it to the DOM
//the input[name] is used by recipient list to display the names, so the function display_name_creator checks if it should display the username or display name
//Kind of like above, but for this, its just a value. We dont inform the user because it's already been done ^^^
function insert_friends_list(friends){
	var total = '';
		function display_name_creator(possible_name,index){
				if (!possible_name == ''){
					return possible_name;
				}
				else{
					console.log("No name available, using username");
					return friends[index].username;
				}
		}//display name creator
		
			for(i=0;i<friends.length;i++){
				var row = '<input type="checkbox" name="'+display_name_creator(friends[i].display_name,i)+'" value="'+friends[i].username+'" id=snapchat'+i+'>'+name_checker(friends[i].display_name)+' ('+friends[i].username+')<br>';
				total += row;
			}
	console.log("Inserting friends list");
	$("#snapchat_friends").html(total);
	listen_for_change();
}
//========================================================================
//Called when the GUI is loaded. Checks how long ago friends list was updated.
//If it's been under 20 minutes, do not request an update
function check_create_friends(username,password){
		console.log("Checking last updated (within 20 minutes)....");
		chrome.storage.local.get(null, function(result){
			var last_updated = result.snapchat_friends_last_updated;
				if (last_updated > (Date.now() - 1200000)){
					console.log("Cached, within 20min, not updating");
					insert_friends_list(result.snapchat_friends_list);
				}
				else{
					console.log("Outdated, lets reload...");
					console.log("reloading with username: "+App_Snapchat_Username+" & Password: "+App_Snapchat_Password);
					create_friends(App_Snapchat_Username,App_Snapchat_Password);
				}
		});
}
//========================================================================
//This is either called by the GUI loading or manually from the update button
//Posts to the server to get the friends list
function create_friends(username,password){
$.ajax(
    {
        url: 'http://107.170.13.216/home.php',
        type:'POST',
        dataType: 'text',
        data: {snapchat_username: username, snapchat_password: password},
        success: function(data)
        {
            var friends = jQuery.parseJSON(data);
			
			//console.log(total);
			var data = {"snapchat_friends_last_updated": Date.now(), "snapchat_friends_list": friends};
			chrome.storage.local.set(data, function() {
				console.log('Updated, with a new time: ' + data.snapchat_friends_last_updated);
				console.log('Updated, with new Friends: ' + friends);
				insert_friends_list(data.snapchat_friends_list);
			});
			
        }
    })//ajax call

};
//========================================================================
//Sending the snapchat. Called after compiling all the neccessary information into an Array
//If its sent successfully, it will log it to the console.
function send_snapchat(snap_package){
	$('#send').hide();
	$('#snapchat_sending').show();
	$.ajax(
    {
        url: 'http://107.170.13.216/snap.php',
        type:'POST',
        dataType: 'text',
        data: {snapchat_username: snap_package.snapchat_username, snapchat_password: snap_package.snapchat_password, image_url: snap_package.image_url, recipient_list: snap_package.recipient_list},
        success: function(data)
        {
			console.log(data);
            if (data == 'true'){
				console.log("Snapchat Successfully Sent");
				$('#send').show();
				$('#snapchat_sending').hide();
			}
			else{
				console.log("Something went wrong...");
			}
			
        }//success function
    })//ajax call
}//send snapchat
//========================================================================
//Called from the send snap button in the GUI
//Grabs all the neccessary information to complete a snap:
//+Collect Names from recipient list
//+Take arguments for username,password and image url
function gather(username,password,image_url){
	var recipients = new Array();
		$( "#snapchat_recipient_list > li" ).each(function( index ) {
			recipients.push($(this).attr("value"));
			
		});
	console.log(recipients);
	var full_snapchat = new Object();
	full_snapchat.snapchat_username = username;
	full_snapchat.snapchat_password = password;
	full_snapchat.image_url = image_url;
	full_snapchat.recipient_list = recipients;
	
	send_snapchat(full_snapchat);
}
//========================================================================
//Runs when the background.js makes a request from the Chrome Context menu
//Calls multiple methods
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
 
    if (request.snapchat == true)
		sendResponse({farewell: "Farewell sent from Code to Background"});
		console.log("Code JS says Image is at: "+request.image_url);
		chrome_storage_get();
		App_Snapchat_Image_URL = request.image_url;
		gui_create();
	
			
});//chrome runtime message
//========================================================================
//Creates the GUI and adds he neccessary button listeners 
function gui_create(){
	var load_url = chrome.extension.getURL("load.gif");
	$.fancybox( '<div id="fancywrap"></div>', {closeBtn: false, topRatio: 0, autoSize: false, width: 430, height: 450} );
	$(".fancybox").fancybox({ helpers:  { overlay : null}});
	$("#fancywrap").append('<div id=snapchat_title>Snapchat for Chrome</div>');
	$("#fancywrap").append('<div id=snapchat_preview><img src="'+App_Snapchat_Image_URL+'" width="95%" height="auto"><div id=snapchat_recipient_list><span id="snapchat_recipient_title">Recipients</span></div></div>');
	$("#fancywrap").append('<div id=snapchat_friends>'+check_create_friends(App_Snapchat_Username,App_Snapchat_Password)+'</div>');
	$("#fancywrap").append('<div id=snapchat_user_info><span class="underline">Username</span><br>' + App_Snapchat_Username + '<br><span class="underline">Password</span><br>' + App_Snapchat_Password + '<br><a href="'+chrome.extension.getURL("options.html")+'">Change Info</a></div>');
	$("#fancywrap").append('<div id=send_button><a id="snapchat_update_friends" class="underline">Update</a><div id="snapchat_sending">Sending...<br></div><button id="send">Send Snap</button></div>');

	$("#snapchat_sending").hide();
	$("#snapchat_sending").append('<img id="snapchat_sending_gif" src="'+load_url+'">');

		$(document).ready(function() {
			var send_snap_button = document.getElementById("send");
			send_snap_button.onclick = function(){ gather(App_Snapchat_Username,App_Snapchat_Password,App_Snapchat_Image_URL); };
					
			var update_friends_button = document.getElementById("snapchat_update_friends");
			update_friends_button.onclick = function(){ create_friends(App_Snapchat_Username,App_Snapchat_Password); console.log("Manually Updating Friends..."); };
		});
}