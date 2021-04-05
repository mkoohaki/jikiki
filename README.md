
#	   J I K I K I

<image src="https://github.com/mkoohaki/jikiki/blob/master/Jikiki.jpg?raw=true" alt="Jikiki application image">

# Author: Meisam Koohaki
# Summer, 2020
#
# Jikiki is a web application which is created in Visual Studio with using full-stack JavaScript solution
# This applicatoin comprises three major building blocks of 4 possible layers:
#   - MongoDB as the database
#   - Express as the web server framework
#   - Node.js as the server platform
# This application can use for putting items for sale, the sequences and the properties are as below:
#	1.	User can see the items even without registration and logging in.
#	2.	User can sign up – after submitting the filled-out form, application sends a link to the email to make sure the email exists, then user after by clicking the link, confirm the account and can log in. 
#		requirements: Unique username and email / equal password and re-password / confirmation email (Application will not accept the email if it even used from google account for registration).
#	3.	User can sign up and log in with google account. 
#		requirement: Unique email (Application will not accept the google account for registration if the email used for registration already).
#	4.	User can retrieve the Username / change password / delete account if provide correct information. (By deleting the account application will delete the account on the server and also local directory
#		which contains the images).
#	5.	After logging in, user can add / edit / delete the items provided, with or without image. If user creates an image for the item, (for first time) application will create a unique local directory for 
#		this user, and if the user deletes all images, after the last one the directory will delete automatically.
#	6.	User (signed up type) can edit account information: add or change user photo / change password / change username / change email / delete account. This photo will be saved in that local directory too.
#	7.	If user logs in with google account, then the application will use the photo of gmail if it is available.
#	8.	User does not have access to change other users’ items.
#	9.	Application display the message for error and success.
#

