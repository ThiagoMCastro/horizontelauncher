const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const https = require('node:https');
const unzipper = require('adm-zip');
const RPC = require('discord-rpc');
const { exec } = require('child_process');
const Winreg = require('winreg'); // Importando winreg
const { spawn } = require('child_process');
const { globalShortcut } = require('electron');
const { autoUpdater } = require("electron-updater")

if (require('electron-squirrel-startup')) {
	app.quit();
}

const configDir = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay');
const configPath = path.join(configDir, 'settings.json');

// Função para garantir que o diretório e o arquivo existam
function ensureConfigFile() {
    // Verifique se a pasta "Horizonte Roleplay" existe
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

    // Verifique se o arquivo "settings.json" existe
	if (!fs.existsSync(configPath)) {
        // Se não existir, cria um arquivo com uma configuração padrão
		const defaultConfig = {
			selectedServer: 0
		};

		fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
		console.log('Arquivo de configuração criado com configuração padrão.');
	}
}

function saveSelectedServer(serverId) {
    // Carregar a configuração atual
	console.log("Tentando salvar servidor " + serverId)
	const config = loadConfig();

    // Atualizar o servidor selecionado
	config.selectedServer = serverId;

    // Salvar no arquivo
	fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
	console.log('Servidor selecionado salvo com sucesso.');
}

// Função para carregar o arquivo de configuração
function loadConfig() {
    ensureConfigFile();  // Certifica que o arquivo de configuração exista
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);  // Retorna o conteúdo do arquivo como objeto
}

// Função para carregar o servidor selecionado
function loadSelectedServer() {
	const config = loadConfig();
    return config.selectedServer || 1;  // Garantir que sempre retorne um valor válido (0 como fallback)
}


const clientId = '821408578681438299';
RPC.register(clientId);

let rpc; // Mantemos o cliente RPC global para atualizar a atividade dinamicamente

let serverInfo = {
	query: [],
	update_time: ''
};

let backgrounds = [
	"linear-gradient(to right, rgb(0 19 28), rgba(0, 0, 0, 0.6)), url(https://www.gtabase.com/igallery/8401-8500/GTA_SanAndreas_DefinitiveEdition_14-8403-1080.jpg)",
	"linear-gradient(to right, rgb(0 19 28), rgba(0, 0, 0, 0.6)), url(https://www.gtabase.com/igallery/8301-8400/GTA_SanAndreas_DefinitiveEdition_6-8369-1080.jpg)",
	"linear-gradient(to right, rgb(0 19 28), rgba(0, 0, 0, 0.6)), url(https://www.gtabase.com/igallery/8401-8500/GTA_SanAndreas_DefinitiveEdition_15-8402-1080.jpg)",
	"linear-gradient(to right, rgb(0 19 28), rgba(0, 0, 0, 0.6)), url(https://www.gtabase.com/igallery/8301-8400/GTA_SanAndreas_DefinitiveEdition_10-8385-1080.jpg)",
	];

let logos = [
	"assets/logo_new.png",
	"assets/logo_new.png",
	"assets/logo_new.png",
	"assets/logo_new.png",
	];

let discords = [
	"https://discord.com/invite/GmrQbRAvrP",
	"https://discord.gg/zb2RfgwKvJ",
	"https://discord.gg/wWpzCGwbve",
	"https://discord.gg/ApWCz9pqqa",
	];

function updateServerInfo() {
	const url = 'https://mobile.horizonte-rp.com/hosted.json';

	https.get(url, (resp) => {
		let data = '';
		resp.on('data', (chunk) => {
			data += chunk;
		});
		resp.on('end', () => {
			try {
				const servers = JSON.parse(data);
				serverInfo.query = []; // Inicializa como array vazio

				// Loop forEach para processar cada servidor
				servers.query.forEach((server, index) => {
					serverInfo.query.push({
						number: server.number,
						name: server.name,
						ip: server.ip,
						port: server.port,
						online: server.online,
						maxplayers: server.maxplayers,
						discord: discords[index] || discords[0],
						logoUrl: logos[index] || logos[0],  // Garantir que o background seja definido corretamente
						background: backgrounds[index] || backgrounds[0],  // Garantir que o background seja definido corretamente
						password: server.password === 'true'
					});
				});
			} catch (error) {
				console.error('Erro ao processar a resposta JSON:', error);
			}
		});
	}).on('error', (err) => {
		console.error('Erro ao fazer a requisição:', err);
	});
}

// Chamada de função para garantir que a informação seja carregada logo ao iniciar
updateServerInfo();
setInterval(updateServerInfo, 10000);  // Ajuste o intervalo para uma atualização mais espaçada (10s)

// Função para atualizar a interface do usuário com as informações do servidor
ipcMain.on('set-server', (event, serverId) => {
	saveSelectedServer(serverId);
	getUsername((username) => {
		if (!username) {
			saveUsername('Nome_Sobrenome');
			username = 'Nome_Sobrenome';
		}
		const selectedServer = serverInfo.query[serverId-1];
		mainWindow.webContents.send('checkSelectedServer', serverId, username, selectedServer);
	});
});

ipcMain.on('open-link', (event, url) => {
	shell.openExternal(url);
});
ipcMain.on('play-samp', (event, serverId) => {
	const sampPath = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game', 'sampcmd.exe');
	
	// Corrigir a validação do servidor
	if (!serverInfo.query[serverId-1]) {
		console.error('ID de servidor inválido:', serverId);
		return;
	}

	const server = serverInfo.query[serverId-1];
	getUsername((username) => {
		if (!username || username === "Nome_Sobrenome" || username === "") {
			console.log("Sem username, solicitar ao usuario um username para definir.");
			mainWindow.webContents.send('show-username-modal');
			return;
		}

		const sampProcess = spawn(`"${sampPath}"`, ['-c', '-h', server.ip, '-p', server.port, '-n', username], {
			cwd: path.dirname(sampPath),
			shell: true
		});

		iStartedGTA = true;

		saveSelectedServer(serverId);
		selectedServer = serverId;

		sampProcess.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});

		sampProcess.stderr.on('data', (data) => {
			console.error(`stderr: ${data.toString()}`);
		});

		sampProcess.on('close', (code) => {
			console.log(`Processo encerrado com o código ${code}`);
		});
	});
});

async function setActivity(activityType) {
	if (!rpc) {
		rpc = new RPC.Client({ transport: 'ipc' });

		rpc.on('ready', () => {
			updateActivity(activityType);
		});

		await rpc.login({ clientId }).catch(console.error);
	} else {
		updateActivity(activityType);
	}
}

function checkGameFolder() {
	const gameFolderPath = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game', 'SAMP');
	let result = fs.existsSync(gameFolderPath);
	return result;
}

var latestVersion = app.getVersion()
var currentVersion = app.getVersion()
async function checkGameUpdate() {
	let needsUpdate = false;

	const gameFolderPath = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game', 'SAMP');
	let result = fs.existsSync(gameFolderPath);
	if (result === true) {
		const updateUrl = 'https://horizonte-rp.com/api/launcher/getUpdate';

		try {
			const updateInfo = await new Promise((resolve, reject) => {
				https.get(updateUrl, (resp) => {
					let data = '';
					resp.on('data', (chunk) => {
						data += chunk;
					});
					resp.on('end', () => {
						try {
							const jsonData = JSON.parse(data);
							resolve(jsonData);
						} catch (error) {
							reject(error);
						}
					});
				}).on('error', (err) => {
					reject(err);
				});
			});

			latestVersion = updateInfo.version;
			currentVersion = app.getVersion();
			const downloadUrl = updateInfo.url;
			return currentVersion !== latestVersion;
		} catch (error) {
			console.error('Erro ao verificar atualizaçao:', error);
			return false;
		}
	} else {
		return true;
	}
}


function createGameFolder() {
	const gameFolderPath = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game');
	if (!fs.existsSync(gameFolderPath)) {
		fs.mkdirSync(gameFolderPath, { recursive: true });
	}
}

function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		const request = https.get(url, (response) => {
			const totalBytes = parseInt(response.headers['content-length'], 10);
			let downloadedBytes = 0;

			response.pipe(file);

			response.on('data', (chunk) => {
				downloadedBytes += chunk.length;
				const percent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
				mainWindow.webContents.send('download-progress', percent);
			});

			file.on('finish', () => {
				file.close(() => resolve());
			});
		});

		request.on('error', (err) => {
			fs.unlink(dest);
			reject(err.message);
		});
	});
}

function extractFile(zipPath, dest) {
	return new Promise((resolve, reject) => {
		const zip = new unzipper(zipPath);
		const totalEntries = zip.getEntries().length;
		let extractedEntries = 0;

		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}

		function extractNextEntry() {
			if (extractedEntries < totalEntries) {
				const entry = zip.getEntries()[extractedEntries];
				const outputPath = path.join(dest, entry.entryName);

				if (fs.existsSync(outputPath)) {
					if (fs.statSync(outputPath).isDirectory()) {
						fs.rmdirSync(outputPath, { recursive: true });
					} else {
						fs.unlinkSync(outputPath);
					}
				}

				zip.extractEntryTo(entry, dest, true, false);
				extractedEntries++;
				const percent = ((extractedEntries / totalEntries) * 100).toFixed(2);
				mainWindow.webContents.send('download-progress', percent, true);

				setImmediate(extractNextEntry);
			} else {
				resolve();
			}
		}

        // Inicia o processo de extração
		extractNextEntry();
	});
}

let selectedServer = loadSelectedServer();

function updateActivity(activityType) {
	let activity;
	const server = serverInfo.query[selectedServer-1]; // Acessa o servidor selecionado no novo formato
	
	// Obtém o username do jogador
	getUsername((username) => {
		switch (activityType) {
		case 'playing':
			activity = {
				details: '#HZRP' + selectedServer + ` | ${server.ip}:${server.port}`,
				state: `${username} (${server.online}/${server.maxplayers})`,
				startTimestamp: new Date(),
				largeImageKey: 'hziconb',
				instance: false,
			};
			break;
		case 'downloading':
			activity = {
				details: 'Fazendo download',
				state: 'Baixando arquivos do jogo',
				startTimestamp: new Date(),
				largeImageKey: 'hziconb',
				instance: false,
			};
			break;
		default:
			activity = {
				details: 'No lobby',
				state: 'Escolhendo servidores',
				startTimestamp: new Date(),
				largeImageKey: 'hziconb',
				instance: false,
			};
			break;
		}

		// Define a atividade no RPC (Rich Presence)
		rpc.setActivity(activity);
	});
}

let mainWindow;

const createWindow = (file) => {
	updateServerInfo();
	mainWindow = new BrowserWindow({
		autoHideMenuBar: true,
		backgroundColor: '#060b0e',
		icon: path.join(__dirname, 'assets/appIcon.ico'),
		resizable: false,
		frame: false,
		width: (file != "download.html") ? (1280) : 800,
		minWidth: (file != "download.html") ? (1280) : 800,
		minimizable: false,
		minHeight: (file != "download.html") ? (720) : 600,
		height: (file != "download.html") ? (720) : 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			enableRemoteModule: false,
			nodeIntegration: true
		},
	});

	ensureConfigFile();

	mainWindow.maximize();
	mainWindow.loadFile(path.join(__dirname, file));
	ipcMain.on('minimize-window', () => {
		mainWindow.minimize();
	});

	ipcMain.on('close-window', () => {
		mainWindow.close();
	});

	if (file === "index.html") {
		mainWindow.webContents.on('did-finish-load', () => {
			mainWindow.webContents.send('play-music');
			console.log('index.html foi carregado com sucesso!');
			getUsername((username) => {
				if (!username) {
					saveUsername('Nome_Sobrenome');
					username = 'Nome_Sobrenome';
				} else {
					console.log(`Nome de usuário encontrado no registro: ${username}`);
				}
				console.log("Servidor salvo eh o "+loadSelectedServer());
				mainWindow.webContents.send('checkSelectedServer', loadSelectedServer(), username, serverInfo.query[loadSelectedServer() -1]);
			});
		});
	}

	// mainWindow.webContents.on("before-input-event", (event, input) => {
	// 	if (input.control && input.code === 'KeyR') {
	// 		event.preventDefault();
	// 		return
	// 	}

	// 	if(input.control && ['Equal', 'Minus'].includes(input.code)) {
	// 		event.preventDefault()
	// 		return
	// 	}
	// })
};


let checkGTAInterval;
let iStartedGTA = false;
let wasRunning = false;
let startTime = null;

function isProcessRunning(processName) {
	return new Promise((resolve, reject) => {
		const cmd = process.platform === 'win32' ? `tasklist` : `pgrep ${processName}`;

		exec(cmd, (error, stdout, stderr) => {
			if (error || stderr) {
				console.error(`Erro ao executar o comando: ${error ? error.message : stderr}`);
				resolve(false);
				return;
			}

			const processFound = stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1;
			resolve(processFound);
		});
	});
}

ipcMain.on('start-check-gta-process', () => {
	if (checkGTAInterval) return; // Impedir múltiplos intervalos

	checkGTAInterval = setInterval(async () => {
		const isRunning = await isProcessRunning('gta_sa.exe');

		// Se o estado mudou de 'não rodando' para 'rodando'
		if (isRunning && !wasRunning && iStartedGTA) {
			console.log("GTA SA iniciado.");
			wasRunning = true;
			startTime = new Date(); // Armazena o tempo de início
			setActivity('playing'); // Define a atividade como jogando
		}

		// Se o estado mudou de 'rodando' para 'não rodando'
		if (!isRunning && wasRunning) {
			console.log("GTA SA foi fechado.");
			wasRunning = false;
			iStartedGTA = false;
			if (startTime) {
				const endTime = new Date();
				const duration = Math.floor((endTime - startTime) / 1000); // Calcula o tempo em segundos
				console.log(`Tempo de execução: ${duration} segundos.`);
				startTime = null;
			}

			setActivity('idle'); // Define a atividade como inativa
		}
		
		// Envia o estado do processo para a interface
		mainWindow.webContents.send('gta-process-status', isRunning);
	}, 1000); // Verifica a cada 1 segundo
});
ipcMain.on('start-check-update', async () => {
	const needsUpdate = await checkGameUpdate(); // Espera pela função assíncrona
	mainWindow.webContents.send('game-needs-update', needsUpdate, currentVersion, latestVersion);

	setInterval(async () => {
		const needsUpdate = await checkGameUpdate(); // Verifica a atualização periodicamente
		mainWindow.webContents.send('game-needs-update', needsUpdate, currentVersion, latestVersion);
	}, 30000);
});
ipcMain.on('stop-check-gta-process', () => {
	clearInterval(checkGTAInterval);
	checkGTAInterval = null;
});


ipcMain.on('start-download', async (event) => {
	const url = 'https://dl.dropboxusercontent.com/scl/fi/pnci4mg85bhnc59t4tvgn/HZRP_GameFolder.zip?rlkey=jxnhtxwtue8d1pv6k3wnld1m8&dl=1';
	const zipPath = path.join(os.tmpdir(), 'HZRP_GameFolder.zip');
	const gameFolderPath = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game');

	createGameFolder();

	try {
        setActivity('downloading'); // Definindo a atividade para "Fazendo download"
        await downloadFile(url, zipPath);
        await extractFile(zipPath, gameFolderPath);
        
        const needsUpdate = checkGameUpdate();
        mainWindow.webContents.send('game-needs-update', needsUpdate);
        
        setActivity('idle'); // Atualizando a atividade para "Jogando" após o download
    } catch (error) {
    	console.error('Erro no download ou extração:', error);
    	dialog.showErrorBox('Erro', 'Ocorreu um erro durante o download ou extração. Por favor, tente novamente.');
    }
});

function saveUsername(username) {
	const regKey = new Winreg({
        hive: Winreg.HKCU, // HKEY_CURRENT_USER
        key: '\\Software\\SAMP' // Caminho da chave
    });

	regKey.get('PlayerName', (err, item) => {
		if (err || !item) {
			regKey.set('PlayerName', Winreg.REG_SZ, username, (err) => {
				if (err) {
					console.error('Erro ao criar a chave PlayerName:', err);
				} else {
					console.log('Nome de usuário salvo com sucesso:', username);
				}
			});
		} else {
			console.log('Nome de usuário já existe:', item.value);
		}
	});
}

function getUsername(callback) {
	const regKey = new Winreg({
        hive: Winreg.HKCU, // HKEY_CURRENT_USER
        key: '\\Software\\SAMP' // Caminho da chave
    });

	regKey.get('PlayerName', (err, item) => {
		if (err || !item) {
			console.error('Erro ao obter o username:', err);
            callback(null); // Retorna null em caso de erro ou se a chave não existir
        } else {
        	console.log('Username obtido com sucesso:', item.value);
            callback(item.value); // Retorna o valor do username
        }
    });
}

function editUsername(newUsername) {
	const regKey = new Winreg({
        hive: Winreg.HKCU, // HKEY_CURRENT_USER
        key: '\\Software\\SAMP' // Caminho da chave
    });

    // Atualizar o nome de usuário
	regKey.set('PlayerName', Winreg.REG_SZ, newUsername, (err) => {
		if (err) {
			console.error('Erro ao atualizar o nome de usuário:', err);
		} else {
			console.log('Nome de usuário atualizado para:', newUsername);
		}
	});
}

// Exemplo de uso
ipcMain.on('save-username', (event, username) => {
	saveUsername(username);
});

ipcMain.on('edit-username', (event, newUsername) => {
	editUsername(newUsername);
});


function checkAndUpdateRegistry() {
	const regKey = new Winreg({
        hive: Winreg.HKCU, // HKEY_CURRENT_USER
        key: '\\Software\\SAMP' // Caminho da chave
    });

    // Caminho dinâmico para a pasta "Documents" do usuário
	const gtaExePath = `"${path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game', 'gta_sa.exe')}"`;

	getUsername((username) => {
		if (!username) {
			saveUsername('Nome_Sobrenome');
		} else {
			console.log(`Nome de usuário encontrado no registro: ${username}`);
		}
	});

	regKey.get('gta_sa_exe', (err, item) => {
		if (err || !item) {
            // Se a chave não existir, vamos criá-la
			regKey.set('gta_sa_exe', Winreg.REG_SZ, gtaExePath, (err) => {
				if (err) {
					console.error('Erro ao criar a chave do registro:', err);
				} else {
					console.log('Chave do registro criada com sucesso:', gtaExePath);
				}
			});
		} else {
            // Se a chave existir, atualize o valor
			regKey.set('gta_sa_exe', Winreg.REG_SZ, gtaExePath, (err) => {
				if (err) {
					console.error('Erro ao atualizar a chave do registro:', err);
				} else {
					console.log('Chave do registro atualizada com sucesso:', gtaExePath);
				}
			});
		}
	});
}


app.whenReady().then(() => {
    checkAndUpdateRegistry(); // Verifica e atualiza a chave do registro
    createWindow('index.html');

    app.on('activate', () => {
    	if (BrowserWindow.getAllWindows().length === 0) {
    		createWindow('index.html');
    	}
    });

    ipcMain.on('open-new-window', (event, url) => {
    	let win = new BrowserWindow({
    		width: 800,
    		height: 600,
    		autoHideMenuBar: true,
    		frame: true,
    		webPreferences: {
    			nodeIntegration: true
    		}
    	});

    	win.loadURL(url);
    });

    setActivity('idle').catch(console.error); // Inicializando como "No lobby"
});

// app.on('browser-window-focus', function () {
// 	globalShortcut.register("CommandOrControl+R", () => {
// 		console.log("CommandOrControl+R is pressed: Shortcut Disabled");
// 	});
// 	globalShortcut.register("F5", () => {
// 		console.log("F5 is pressed: Shortcut Disabled");
// 	});
// });
// app.on('browser-window-blur', function () {
// 	globalShortcut.unregister('CommandOrControl+R');
// 	globalShortcut.unregister('F5');
// });


app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
