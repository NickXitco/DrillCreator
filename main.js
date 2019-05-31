//const electron = require('electron'); //TODO I don't think this is necessary, but add it back in if things break.

const { app, BrowserWindow, Menu, ipcMain} = require('electron');

//SET ENV
//process.env.NODE_ENV = 'production'; //TODO UNCOMMENT THIS WHEN DONE


//Keep a global reference of the window object. If we didn't have this,
//then the window will be closed automatically when the JS Object is garbage collected.
let mainWindow;
let addItemWindow;

//This method will be called when Electron has finished initialization
// and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow);

function createMainWindow() {
    //Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });

    //and then load the mainWindow.html of the app.
    mainWindow.loadFile('mainWindow.html');

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed', () => {
        app.quit()
    })
}

// Handle creating AddItemWindow
function createAddItemWindow() {
    //Create the browser window.
    addItemWindow = new BrowserWindow({
        width: 300, //TODO see if you can find a way to get some fraction of the native screen width
        height: 200,
        title: 'Add Drill Item',
        webPreferences: {
            nodeIntegration: true
        }
    });

    //and then load the mainWindow.html of the app.
    addItemWindow.loadFile('addItemWindow.html');

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);

    //Garbage collection handling
    addItemWindow.on('closed', () => {
        // Deference the window object on close, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        addItemWindow = null
    })
}

// Catch item:add
ipcMain.on('item:add', function(e, item){
    mainWindow.webContents.send('item:add', item);
    addItemWindow.close();
});

ipcMain.on('new:open', function(){
    createAddItemWindow();
});


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicity with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
// Reactivates main window on macOS open
app.on('activate', () => {
    //On macOS it's common to re-create a window in the app when
    // the dock icon is clicked and there are no other windows open.
});

// Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add Item',
                accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
                click(){
                    createAddItemWindow();
                }
            },
            {
                label: 'Clear Items',
                click(){
                    mainWindow.webContents.send('item:clear');
                }
            },
            {
                label: 'Quit',
                //Hotkey//shortcut
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// Add developer tools item if not in prod
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Tools',
        submenu: [
            {
                label: 'Developer Tools',
                accelerator: process.platform === 'darwin' ? 'Command+Shift+D' : "Ctrl+Shift+D",
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                //Special secret "macro"
                role: 'reload'
            }
        ]
    })
}