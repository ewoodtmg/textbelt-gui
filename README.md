# textbelt-gui
A simple web interface for textbelt.

ChatGPT and I made the wrapper in order for me to learn how to code more. The project is intended to run with docker, though I you can manually install it if you want to.
I don't suggest setting this publically as I don't trust the security really. You should probably change the jwt in server.js

To start, download and run the following:
```docker-compose
docker-compose up --build
```
### Why not use another wrapper for Textbelt?
My wrapper allows you to create users, message multiple numbers with one message, check how many messages are remaining for an apikey, and check history of messages sent and to whom it was sent.

### That's great... how do I use it?
The app should be available at port 3000 of the IP. If running locally, that should be localhost:3000

![image](https://github.com/ewoodtmg/textbelt-gui/assets/30943390/32c811f7-1d1c-40c1-9e5e-1b2af0b108e5)

#### Web Interface
The web interface is very simple.
Login or register an account and you'll be greeted with this page:

![image](https://github.com/ewoodtmg/textbelt-gui/assets/30943390/6d311f8c-5e93-479c-a109-b9c360d0521a)

To get the API Key, use https://textbelt.com/ and select Create an API key
Textbelt also allows 1 free message using the apikey found in the docs. (yeah, I'm gonna make you read it)

You can click on a past message to see who you sent the message to. This is planned to be worked on later to get the status of each message from the textbelt api.
 
#### Admin Page
The default admin credentials are admin:admin
You'll get to the admin page by going to $your_ip:3000/admin
Log in and from there you should be able to manage user permissions and even delete users.

![image](https://github.com/ewoodtmg/textbelt-gui/assets/30943390/d7c58551-f01b-40aa-a509-94f268edc6b5)

