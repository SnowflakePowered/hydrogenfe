const { app, BrowserWindow, ipcMain } = require('electron')
const { EventEmitter } = require("events")
const path = require('path')
const url = require('url')
const { spawn } = require('child_process')
const fetch = require('electron-fetch')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

/** @type {BrowserWindow} */
let mainWindow 

function createSnowflake() {
  if (process.platform === "win32" && process.arch == "x64") {
    const snowflake = spawn("./snowflakeapp/win10-x64/Snowflake.Bootstrap.Windows.exe")
    return snowflake
  } 
}

function ensureSnowflakeConnection(connectedCallback, notConnectedCallback) {
  const defaultHeaders = {
    'Content-Type': 'application/json'
  }

  fetch("http://localhost:9797", {
    method: "POST",
    credentials: 'include',
    headers: Object.assign({}, defaultHeaders),
    body: null
  }).then((response) => {
    return response.text()
  }).then((text) => {
    connectedCallback()
  }).catch(() => {
    notConnectedCallback()
  })
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, webPreferences: { webSecurity: false }})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  ipcMain.on('snowflake-graphql-ping', (event, arg) => {
    ensureSnowflakeConnection(() => {
      event.sender.send('snowflake-graphql-pong', true)
    }, 
    () => {
      event.sender.send('snowflake-graphql-pong', false)
    })
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  const snowflake = createSnowflake()

  snowflake.stdout.on('data', function (data) {
    mainWindow.webContents.send('snowflake-status', data.toString())
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    snowflake.kill()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.