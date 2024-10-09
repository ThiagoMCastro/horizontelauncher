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
const log = require('electron-log');
require('dotenv').config();

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info"; // Altere para "debug" para mais detalhes
autoUpdater.logger.transports.console.level = "info"; // Altere para "debug" para mais detalhes
autoUpdater.addAuthHeader(`Bearer ${process.env.GITHUB_TOKEN}`);
if (require('electron-squirrel-startup')) {
	app.quit();
}

const configDir = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher');
const configPath = path.join(configDir, 'settings.json');

function ensureConfigFile() {
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

	if (!fs.existsSync(configPath)) {
		app.setLoginItemSettings({
			openAtLogin: true
		})
		const defaultConfig = {
			selectedServer: 1,
			gameVersion: 0,
			currentVersion: app.getVersion(),
		};

		fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
	}
}

function saveSelectedServer(serverId) {
	const config = loadConfig();
	if(serverId < 1) serverId = 1;
	else if(serverId > 4) serverId = 4;
	config.selectedServer = serverId;
	fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

function saveCurrentLauncherVersion(version) {
	const config = loadConfig();
	config.currentVersion = version;
	fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}


function saveCurrentGameVersion(version) {
	const config = loadConfig();
	config.gameVersion = version;
	fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

function loadConfig() {
	ensureConfigFile();
	const configData = fs.readFileSync(configPath, 'utf8');
	return JSON.parse(configData);
}

function loadSelectedServer() {
	const config = loadConfig();
	if(config.selectedServer < 1) saveSelectedServer(1);
	else if(config.selectedServer > 4) saveSelectedServer(4);
    return loadConfig().selectedServer;  // Garantir que sempre retorne um valor válido (0 como fallback)
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
	if(serverId == 0) serverId = 1;
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

ipcMain.on('toggleAutoLaunch', (event, toggle) => {
	console.log("Definindo auto launch para "+toggle);
	app.setLoginItemSettings({
		openAtLogin: toggle
	})
});
ipcMain.on('getAutoLaunchStatus', (event) => {
	const isEnabled = app.getLoginItemSettings().openAtLogin;
    mainWindow.webContents.send('autoLaunchStatus', isEnabled);  // Envia o status de volta ao front-end
});


ipcMain.on('open-game-folder', (event) => {
	const gameFolder = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game');
	shell.openPath(gameFolder)
	.then((result) => {
		if (result) {
			console.error(`Erro ao abrir a pasta: ${result}`);
		} else {
			console.log(`Pasta aberta com sucesso: ${gameFolder}`);
		}
	})
	.catch((err) => {
		console.error(`Erro ao abrir a pasta: ${err}`);
	});
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

var latestVersion;
var currentVersion;
var latestLauncherVersion;
var currentLauncherVersion;

async function checkGameUpdate() {
	let needsUpdate = false;
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

		latestVersion = updateInfo.game_data.padrao.version;
		currentVersion = loadConfig().gameVersion;
		const downloadUrl = updateInfo.game_data.padrao.url;
		return currentVersion !== latestVersion;
	} catch (error) {
		console.error('Erro ao verificar atualizaçao:', error);
		return false;
	}
}

async function checkLauncherUpdate() {
	let needsUpdate = false;
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

		latestLauncherVersion = updateInfo.launcher.version;
		currentLauncherVersion = loadConfig().currentVersion;
		return currentLauncherVersion !== latestLauncherVersion;
	} catch (error) {
		console.error('Erro ao verificar atualizaçao do launcher', error);
		return false;
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

        // Cria o diretório de destino se não existir
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}

		function removeExistingEntry(outputPath) {
            // Remove arquivo ou diretório existente
			if (fs.existsSync(outputPath)) {
				const stat = fs.statSync(outputPath);
				try {
					if (stat.isDirectory()) {
                        fs.rmdirSync(outputPath, { recursive: true }); // Remove diretório recursivamente
                    } else {
                        fs.unlinkSync(outputPath); // Remove arquivo
                    }
                } catch (error) {
                	console.log(`Não foi possível remover ${outputPath}:`, error.message);
                }
            }
        }

        function extractNextEntry() {
        	if (extractedEntries < totalEntries) {
        		const entry = zip.getEntries()[extractedEntries];
        		const outputPath = path.join(dest, entry.entryName);

                // Remove o arquivo/diretório existente antes de extrair
        		removeExistingEntry(outputPath);

        		try {
                    // Extraindo a entrada para o diretório de destino
        			zip.extractEntryTo(entry, dest, true, false);
        		} catch (error) {
                    // Apenas loga o erro e continua
        			console.error(`Erro ao extrair entrada: ${entry.entryName}. Continuando...`, error);
        		}

        		extractedEntries++;
        		const percent = ((extractedEntries / totalEntries) * 100).toFixed(2);
        		mainWindow.webContents.send('download-progress', percent, true);

                setImmediate(extractNextEntry); // Chama a próxima entrada de forma assíncrona
            } else {
            	saveCurrentGameVersion(latestVersion);
                resolve(); // Resolve a promise quando todas as entradas forem extraídas
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
			preload: path.join(__dirname, 'preload.obfuscated.js'),
			contextIsolation: true,
			enableRemoteModule: false,
			nodeIntegration: true
		},
	});

	ensureConfigFile();
	currentLauncherVersion = app.getVersion();
	saveCurrentLauncherVersion(currentLauncherVersion);

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

	if(loadSelectedServer() == 0) saveSelectedServer(1);
	saveSelectedServer(loadSelectedServer());
	getUsername((username) => {
		if (!username) {
			saveUsername('Nome_Sobrenome');
			username = 'Nome_Sobrenome';
		}
		const selectedServer = serverInfo.query[loadSelectedServer()-1];
		mainWindow.webContents.send('checkSelectedServer', loadSelectedServer(), username, selectedServer);
	});

	mainWindow.webContents.on("before-input-event", (event, input) => {
		if (input.control && input.code === 'KeyR') {
			event.preventDefault();
			return
		}

		if(input.control && ['Equal', 'Minus'].includes(input.code)) {
			event.preventDefault()
			return
		}
	})
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
		
		const gameFolder = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game');
		mainWindow.webContents.send('gta-process-status', isRunning, gameFolder);
	}, 1000); // Verifica a cada 1 segundo
});
ipcMain.on('start-check-update', async () => {
	const needsUpdate = await checkGameUpdate(); // Espera pela função assíncrona
	mainWindow.webContents.send('game-needs-update', needsUpdate, loadConfig().gameVersion, latestVersion);

	setInterval(async () => {
		const needsUpdate = await checkGameUpdate(); // Verifica a atualização periodicamente
		mainWindow.webContents.send('game-needs-update', needsUpdate, loadConfig().gameVersion, latestVersion);
	}, 60000);
});
ipcMain.on('start-check-launcher-update', async () => {
	const needsUpdate = await checkLauncherUpdate(); // Espera pela função assíncrona
	mainWindow.webContents.send('launcher-needs-update', needsUpdate, loadConfig().currentVersion, latestLauncherVersion);

	setInterval(async () => {
		const needsUpdate = await checkLauncherUpdate(); // Verifica a atualização periodicamente
		mainWindow.webContents.send('launcher-needs-update', needsUpdate, loadConfig().currentVersion, latestLauncherVersion);
	}, 60000);
});
ipcMain.on('stop-check-gta-process', () => {
	clearInterval(checkGTAInterval);
	checkGTAInterval = null;
});


ipcMain.on('start-download', async (event) => {
	const zipPath = path.join(os.tmpdir(), 'HZRP_GameFolder.zip');
	const gameFolderPath = path.join(os.homedir(), 'Documents', 'Horizonte Roleplay Launcher', 'Game');

	createGameFolder();

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

		latestVersion = updateInfo.game_data.padrao.version;
		currentVersion = loadConfig().gameVersion;
		const url = updateInfo.game_data.padrao.url;
		try {
			setActivity('downloading');
			await downloadFile(url, zipPath);
			await extractFile(zipPath, gameFolderPath);

			const needsUpdate = checkGameUpdate();
			mainWindow.webContents.send('game-needs-update', needsUpdate, loadConfig().gameVersion, latestVersion);

			setActivity('idle');
		} catch (error) {
			console.error('Erro no download ou extração:', error);
			dialog.showErrorBox('Erro', 'Ocorreu um erro durante o download ou extração. Por favor, tente novamente.');
		}
	} catch (error) {
		console.error('Erro ao verificar atualizaçao:', error);
		return false;
	}
});


ipcMain.on('start-download-launcher', async (event) => {
    // Verifica se o autoUpdater já está em execução
	if (autoUpdater.downloadPromise) {
		console.warn('Um download já está em andamento.');
		return;
	}

    // Inicia a verificação de atualizações
	try {
		const updateCheckResult = await autoUpdater.checkForUpdates();
		if (updateCheckResult && updateCheckResult.updateInfo) {
			startFakeProgress();
			autoUpdater.downloadUpdate();
		} else {
			event.reply('update-not-available');
		}
	} catch (error) {
		console.error('Erro ao verificar atualizações:', error);
		event.reply('update-error', error.message);
	}

});
let fakeProgress = 0;
let intervalId;
function startFakeProgress() {
	intervalId = setInterval(() => {
		if (fakeProgress < 95) {
            fakeProgress += 0.2;  // Aumenta progressivamente até 95%
            mainWindow.webContents.send('download-progress-launcher', fakeProgress);
        }
    }, 600);  // Incremento a cada 100ms
}

function stopFakeProgress() {
    clearInterval(intervalId);  // Para o incremento
    fakeProgress = 100;  // Quando o download real termina, seta para 100%
    mainWindow.webContents.send('download-progress-launcher', fakeProgress);  // Envia 100% para o frontend
}

// Evento quando a atualização é baixada
autoUpdater.on('update-downloaded', (info) => {
	stopFakeProgress();
	saveCurrentLauncherVersion(latestLauncherVersion);
	autoUpdater.quitAndInstall(true, true)
});

autoUpdater.on('error', (error) => {
	console.error('Erro no autoUpdater:', error);
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
				}
			});
		} else {
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
		}
	});

	regKey.get('gta_sa_exe', (err, item) => {
		if (err || !item) {
            // Se a chave não existir, vamos criá-la
			regKey.set('gta_sa_exe', Winreg.REG_SZ, gtaExePath, (err) => {
				if (err) {
					console.error('Erro ao criar a chave do registro:', err);
				} else {
				}
			});
		} else {
            // Se a chave existir, atualize o valor
			regKey.set('gta_sa_exe', Winreg.REG_SZ, gtaExePath, (err) => {
				if (err) {
					console.error('Erro ao atualizar a chave do registro:', err);
				} else {
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
    			devTools: !app.isPackaged,
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
