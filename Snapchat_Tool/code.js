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

function name_checker(name){
	if (!name){
	name = "<a id='no_display_name' class='underline' title='There is no display name for this contact. Go to Snapchat App to change.'>NDN</a>";
	}
	
	return name;
}
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
function check_create_friends(username,password){
		console.log("Checking last updated (20 minutes)....");
		chrome.storage.local.get(null, function(result){
			var last_updated = result.snapchat_friends_last_updated;
				if (last_updated > (Date.now() - 1200000)){
					console.log("Cached, within 20min, not updating");
					insert_friends_list(result.snapchat_friends_list);
				}
				else{
					console.log("Outdated, lets reload...")
					create_friends(username,password);
				}
		});
}
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

};//create freinds
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
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  var load_url = chrome.extension.getURL("load.gif");
    if (request.snapchat == true)
		sendResponse({farewell: request.image_url});
		console.log("Code JS says Image is at: "+request.image_url);
			chrome.storage.local.get(null, function(result){
		  
		  
			$.fancybox( '<div id=snapchat_title>Snapchat for Chrome</div><div id=snapchat_preview><img src="'+request.image_url+'" width="95%" height="auto"><div id=snapchat_recipient_list><span id="snapchat_recipient_title">Recipients</span></div></div><div id=snapchat_friends>'+check_create_friends(result.snapchat_username,result.snapchat_password)+'</div><div id=snapchat_user_info><span class="underline">Username</span><br>' + result.snapchat_username + '<br><span class="underline">Password</span><br>' + result.snapchat_password + '<br><a href="'+chrome.extension.getURL("options.html")+'">Change Info</a></div><div id=send_button><a id="snapchat_update_friends" class="underline">Update</a><div id="snapchat_sending">Sending...<br></div><button id="send">Send Snap</button></div>', {closeBtn: false, topRatio: 0, autoSize: false, width: 430, height: 450} );
			$(".fancybox").fancybox({ helpers:  { overlay : null}});
			$("#snapchat_sending").hide();
			$("#snapchat_sending").append('<img id="snapchat_sending_gif" src="'+load_url+'">');
				$(document).ready(function() {
					var send_snap_button = document.getElementById("send");
					send_snap_button.onclick = function(){ gather(result.snapchat_username,result.snapchat_password,request.image_url); };
					
					var update_friends_button = document.getElementById("snapchat_update_friends");
					update_friends_button.onclick = function(){ create_friends(result.snapchat_username,result.snapchat_password); console.log("Manually Updating Friends..."); };
				});
			});
			
});
