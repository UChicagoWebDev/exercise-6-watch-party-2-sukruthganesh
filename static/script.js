// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");
const CHANGE_USERNAME = '/api/user/name';
const CHANGE_PASSWORD = '/api/user/password';
const CHANGE_ROOM = '/api/room/name';
const SIGNUP = '/api/signup';
const SIGNUP_DETAILS = '/api/signup/details';
const POST_MESSAGE = '/api/room/new_msg'
const LOGIN_URL = '/api/login';
const NEW_ROOM = '/api/rooms/new';
const ALL_MESSAGES = '/api/room/messages';
const ALL_ROOMS = '/api/rooms';
const ERROR = '/api/error';

let getAllChatsReq = {
  room_id: 0
};

let postRequest = {
  room_id: 0,
  body: ''
};

let updateUserNameRequest = {
  user_name: ''
};

let updatePasswordRequest = {
  Password: ''
};

let rooms = {};
let old_path = '';
let CURRENT_ROOM = 0;

let loginDict = {
  userName: '',
  password: ''
};

let updateRoomRequest = {
  name: '',
  room_id: 0
};

let signUpDetails = {
  userName: '',
  Password: ''
};

// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password]").value;
  const r = repeatPassword.value;
  return p == r;
};

const checkPasswordRepeat = () => {
  const passwordField = document.querySelector(".profile input[name=password]");
  if(passwordField.value == repeatPasswordField.value) {
    repeatPasswordField.setCustomValidity("");
    return;
  } else {
    repeatPasswordField.setCustomValidity("Password doesn't match");
  }
}

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);

// TODO:  On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// TODO:  When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// TODO:  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)

// On page load, show the appropriate page and hide the others

async function generateUrl(endPoint, requestBody, requestHeader, type){
  let url = endPoint + (Object.keys(requestBody).length > 0 ? ("?" + Object.keys(requestBody).map((key) => key+"="+encodeURIComponent(requestBody[key])).join("&")): "");
  let urlHeaders = new Headers();
  urlHeaders.append("Accept", "application/json");
  urlHeaders.append("Content-Type", "application/json");
  urlHeaders.append("Api-Key", localStorage.getItem('API-KEY'));
  urlHeaders.append("User-Id", localStorage.getItem('User-Id'));

  Object.keys(requestHeader).forEach(function(key) {
    urlHeaders.append(key, requestHeader[key]);
  });

  const dict = {
    method: type,
    headers: urlHeaders,
  };

  data = await fetch(url, dict);
  jsonForm = await data.json();
  return jsonForm
}


routePageHelper = (element) => {
  CURRENT_ROOM = 0;
  PROFILE.classList.add('hide');
  LOGIN.classList.add('hide');
  ROOM.classList.add('hide');
  SPLASH.classList.add('hide');
  element.classList.remove('hide');
}

let displayElement = (cls) => {
  document.querySelector(cls).classList.remove("hide");
}

let hideElement = (cls) => {
  document.querySelector(cls).classList.add("hide");
}

function loggedIn(){
  hideElement(".signup");
  hideElement(".loginHeader .loggedOut");
  displayElement(".create");
  displayElement(".loginHeader .loggedIn");

  let userName = document.getElementsByClassName('username');

  for(let i=0; i < userName.length; i++){
    if(!userName[i].innerHTML.includes("Welcome")){
      userName[i].innerHTML = '<a onclick="updateDetails()" style="text-decoration: underline; cursor: pointer; color: blue;">' + localStorage.getItem('User-Name') + 
      '</a>! <a class="logout" onclick="logoutUser()" style="text-decoration: underline; cursor: pointer;">(logout)</a>'; 
    }
    else {
      userName[i].innerHTML = 'Welcome back, <a onclick="updateDetails()" style="text-decoration: underline; cursor: pointer; color: blue;">' + localStorage.getItem('User-Name') + 
      '</a>! <a class="logout" onclick="logoutUser()" style="text-decoration: underline; cursor: pointer;">(logout)</a>'; 
    }
  }
  let userNameInput = document.querySelector('input[name="username"]');
  userNameInput.value = localStorage.getItem('User-Name');
}

function loggedOut(){
  hideElement(".create");
  hideElement(".loginHeader .loggedIn");
  displayElement(".signup");
  displayElement(".loginHeader .loggedOut");
}

function loadPage(url){
  window.history.pushState(null, null, '/' + url);
  router();
}

function hideDefault(){
  document.querySelector('.editRoomName').classList.add('hide');
  document.querySelector('.displayRoomName').classList.remove('hide');
}

function hideUnhide(){
  document.querySelector('.login .failed').setAttribute("style", "display: none");
}

async function signUpUser() {
  postMsg = await generateUrl(SIGNUP, {}, {}, 'POST');
  localStorage.setItem('User-Id', postMsg.user_id);
  localStorage.setItem('User-Name', postMsg.user_name);
  localStorage.setItem('API-KEY', postMsg.api_key);
  loadPage('');
}

function logoutUser(){
  rooms = {};
  let msgsDiv = document.body.querySelector(".roomList");
  let child = msgsDiv.lastElementChild;
  localStorage.removeItem('API-KEY');
  while (child) {
    msgsDiv.removeChild(child);
    child = msgsDiv.lastElementChild;
  }
  document.querySelector('.noRooms').setAttribute("style", "display: block");
  loadPage('');
}

async function signUpUserWithDetails() {
  signUpDetails.userName = document.getElementById('username').value;
  signUpDetails.Password = document.getElementById('password').value;
  postMsg = await generateUrl(SIGNUP_DETAILS, {}, signUpDetails, 'POST');
  localStorage.setItem('User-Id', postMsg.user_id);
  localStorage.setItem('User-Name', postMsg.user_name);
  localStorage.setItem('API-KEY', postMsg.api_key);
  loadPage('');
}

async function loginUser(){
  loginDict.userName = document.getElementById('username').value;
  loginDict.password = document.getElementById('password').value;
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  let loginUsr = await generateUrl(LOGIN_URL, {}, loginDict, 'POST');
  if(loginUsr.api_key.length > 0){
    localStorage.setItem('User-Id', loginUsr.user_id);
    localStorage.setItem('User-Name', loginUsr.user_name);
    localStorage.setItem('API-KEY', loginUsr.api_key);
    loadPage(old_path.length > 0 ? old_path : '');
  } else {
    document.querySelector('.login .failed').setAttribute("style", "display: flex");
  }
  return;
}

async function updateUsername(){
  updateUserNameRequest.user_name = document.querySelector('input[name="username"]').value;
  postMsg = await generateUrl(CHANGE_USERNAME, updateUserNameRequest, {}, 'POST');
  localStorage.setItem('User-Name', postMsg['name']);
  loggedIn();
}

async function updatePassword(){
  let password = document.querySelector('input[name="password"]').value;
  let repeat_pass = document.querySelector('input[name="repeatPassword"]').value;

  if(password == repeat_pass){
    updatePasswordRequest.Password = password;
    postMsg = await generateUrl(CHANGE_PASSWORD, {}, updatePasswordRequest, 'POST');
  }
  loggedIn();
}


function loadRoom(roomId) {
  loadPage("room/" + roomId);
}

async function createNewRoom(){
  let newRoom = await generateUrl(NEW_ROOM, {}, {}, 'POST');
  loadPage('room/' + newRoom['room_id']);
}

function toggleEditMode(){
  document.querySelector('.displayRoomName').classList.add('hide');
  document.querySelector('.editRoomName').classList.remove('hide');
}

async function postMessage(body) {
  postRequest.room_id = CURRENT_ROOM;
  postRequest.body = body;
  postMsg = await generateUrl(POST_MESSAGE, postRequest, {}, 'POST')
  document.getElementById("commentTA").value = '';
}

async function populateRooms(){
  rooms = await generateUrl(ALL_ROOMS, {}, {}, 'GET')
  let msgsDiv = document.body.querySelector(".roomList");
  let child = msgsDiv.lastElementChild;
  while (child) {
    msgsDiv.removeChild(child);
    child = msgsDiv.lastElementChild;
  }

  if(Object.keys(rooms).length <= 0){
    document.querySelector('.noRooms').setAttribute("style", "display: block");
  } else {
    document.querySelector('.noRooms').setAttribute("style", "display: none");
  }

  Object.keys(rooms).forEach(key => {
    let msg = document.createElement("a");
    msg.setAttribute("style", "cursor: pointer;")
    msg.setAttribute("onclick", "loadRoom(" + key + ', "' + rooms[key]['name'] + '")');
    msg.innerHTML = key + ': <strong>' + rooms[key]['name'] + "</strong>";
    msgsDiv.append(msg);
  });
}

async function saveRoomName() {
  updateRoomRequest.name = document.getElementById('roomNameInput').value;
  updateRoomRequest.room_id = CURRENT_ROOM;
  var resp = await generateUrl(CHANGE_ROOM, updateRoomRequest, {}, 'POST');
  document.querySelector('.displayRoomName strong').innerHTML = updateRoomRequest.name;
  document.querySelector('.editRoomName').classList.add('hide');
  document.querySelector('.displayRoomName').classList.remove('hide');
}

async function updateDetails(){
  loadPage('profile');
}


let router = async () => {
  let path = window.location.pathname;
  if(localStorage.getItem('API-KEY') == null){
    loggedOut();

    if(path != "/" && path.length > 1){
      splitted = path.split('/');
      old_path = splitted[1];
      for(var j = 2; j < splitted.length; j++){
        old_path += '/' + splitted[j];
      }
      window.history.pushState(null, null, '/login');
      path = '/login';
    }
  }
  else{
    loggedIn();

    if(path == "/login"){
      window.history.pushState(null, null, '/');
      path = '/';
    }
  }
  hideDefault();
  hideUnhide();

  if(path == "/" || path == "/room") {
    document.title = 'Home';
    routePageHelper(SPLASH);
    if(localStorage.getItem('API-KEY') != null){
      await populateRooms();
    }
  }
  else if(path == "/profile"){
    document.title = 'Signup and Update';
    routePageHelper(PROFILE);
  }
  else if(path.startsWith("/room/")) {
    document.title = 'Rooms';
    routePageHelper(ROOM);

    CURRENT_ROOM = path.split('/')[2];
    document.title = 'Room ' + CURRENT_ROOM;

    await populateRooms();
    document.querySelector('.displayRoomName strong').innerHTML = rooms[CURRENT_ROOM]['name'];
    document.getElementById('roomNameInput').value = rooms[CURRENT_ROOM]['name'];
    document.querySelector('.roomDetail #roomId').innerHTML = '/rooms/' + CURRENT_ROOM;

  }
  else if(path == "/login") {
    document.title = 'Login';
    routePageHelper(LOGIN);
  } 
  else {
    await generateUrl(ERROR, {}, {}, 'POST');
    console.log("I don't know how we got to "+path+", but something has gone wrong");
  }
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);

async function startMessagePolling() {
  setInterval(async () => {
    if (CURRENT_ROOM == 0) return;
    getAllChatsReq.room_id = CURRENT_ROOM;
    let msgs = await generateUrl(ALL_MESSAGES, getAllChatsReq, 'GET')
    let msgsDiv = document.body.querySelector(".messages");
    let child = msgsDiv.lastElementChild;
    while (child) {
      msgsDiv.removeChild(child);
      child = msgsDiv.lastElementChild;
    }

    Object.keys(msgs).forEach(key => {
      let message = document.createElement("message");
      let author = document.createElement("author");
      author.innerHTML = msgs[key].name;
      let content = document.createElement("content");
      content.innerHTML = msgs[key].body;
      message.appendChild(author);
      message.appendChild(content);
      msgsDiv.append(message);
    });
  }, 500);
  return;
}
