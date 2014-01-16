// Saves options to localStorage.
function save_options() {
  var username_input = document.getElementById("username");
  var username = username_input.value;

  var password_input = document.getElementById("password");
  var password = password_input.value;
  
  var data = {"snapchat_username": username, "snapchat_password": password};
chrome.storage.local.set(data, function() {
        alert('Login Info Saved');
    });
}


document.addEventListener('DOMContentLoaded', function() {

	chrome.storage.local.get(null, function(result){
		var user = result.snapchat_username;
		var pass = result.snapchat_password;

		var user_field = document.getElementById("username");
		user_field.value = user;
		var pass_field = document.getElementById("password");
		pass_field.value = pass;
	});
	
}, false);
document.querySelector('#save').addEventListener('click', save_options);

//show all values in chrome storage
//chrome.storage.sync.get(null, function(all) {console.log(all)});

