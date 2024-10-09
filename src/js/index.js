let server_selected = 0;
let new_server_selected = 0;
document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electron.send('minimize-window');
});

document.getElementById('close-btn').addEventListener('click', () => {
    window.electron.send('close-window');
});

function openLink(url) {
    window.electron.send('open-link', url);
}

function openGameFolder() {
    window.electron.send('open-game-folder');
}

function loadPage(page) {
    fetch(`./pages/${page}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        document.getElementById('app-content').innerHTML = html;
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const page = link.getAttribute('data-page');
                loadPage(page);
            });
        });

        setInterval(function() {
            const playSampButton = document.getElementById('play-samp');
            if (server_selected === 0 || isGameRunning) {
                if (playSampButton) {
                    document.getElementById("selectedservernum").innerHTML = `#${server_selected}`;
                    playSampButton.setAttribute("disabled", true);
                    playSampButton.classList.add("disabled");
                }
            } else {
                if (playSampButton) {
                    document.getElementById("selectedservernum").innerHTML = `#${server_selected}`;
                    playSampButton.removeAttribute("disabled");
                    playSampButton.classList.remove("disabled");
                }
            }
        }, 10);

        document.getElementById('play-samp').addEventListener('click', () => {
            document.getElementById('volume_off').style.display = "block";
            document.getElementById('volume_on').style.display = "none";
            document.getElementById('backgroundMusic').volume = 0.0;
            muted = true;
            window.electron.send('play-samp', server_selected);
        });
        document.getElementById('toggleVolume').addEventListener('click', () => {
            if(!muted) {
                document.getElementById('volume_off').style.display = "block";
                document.getElementById('volume_on').style.display = "none";
                document.getElementById('backgroundMusic').volume = 0.0;
                muted = true;
            } else {
                document.getElementById('volume_on').style.display = "block";
                document.getElementById('volume_off').style.display = "none";
                muted = false;
                document.getElementById('backgroundMusic').volume = 0.5;
            }
        });
        const playlist = [
            { title: "MC Neguinho do Kaxeta - Louco e Sonhador", src: "https://server1.mtabrasil.com.br/play?id=Xj4ETM2IJY8" },
            { title: "WIU - Rainha do frenesse", src: "assets/musics/wiurainha.mp3" },
            { title: "WIU - Coração de gelo", src: "assets/musics/wiucoracao.mp3" },
            { title: "DJ Topo - MTG Quem não quer sou eu", src: "assets/musics/quemnaoquer.mp3" },
            { title: "Hungria - Mais brabo que vovô", src: "assets/musics/maisbrabo.mp3" },
            { title: "MC Paulin da Capital - Aoa", src: "https://server1.mtabrasil.com.br/play?id=irpgO16C9YA" },
            { title: "Matuê - Crack com Mussilon", src: "assets/musics/matuemussilon.mp3" },
            { title: "MC Ryan SP - Sempre na simplicidade", src: "https://server1.mtabrasil.com.br/play?id=gG4LVrXaNeI" },
            { title: "MC PH - Let's Go 4", src: "assets/musics/letsgo4.mp3" },
            { title: "MC IG - Diz aí qual é o plano", src: "https://server1.mtabrasil.com.br/play?id=1NY-2dZphF0" },
            { title: "MC Marks - Na pura humildade", src: "https://server1.mtabrasil.com.br/play?id=6Eb2WnVyhys" },
            { title: "MC Paulin da Capital - Eu achei", src: "https://server1.mtabrasil.com.br/play?id=Rr8NRWfyXto" },
            { title: "Cabelinho - Carta aberta", src: "assets/musics/cabelinhocartaaberta.mp3" },
            { title: "Teto - Zumzumzum", src: "assets/musics/tetozumzumzum.mp3" },
            { title: "Cabelinho - Bala e fogo", src: "assets/musics/cabelinhobalaefogo.mp3" },
            { title: "MuluBeats - MTG CHIHIRO", src: "assets/musics/chihiro.mp3" },
            { title: "MC Davi - Pagodeiro 2", src: "https://server1.mtabrasil.com.br/play?id=jJX1h7UAllE" },
            { title: "Hungria - Chevette do Jacó", src: "assets/musics/chevette.mp3" },
            { title: "MC Paulin da Capital - Quebradas", src: "https://server1.mtabrasil.com.br/play?id=ENHwrVK0wn8" }
            ];

        let shuffledPlaylist = shuffleArray(playlist.slice());
let currentMusicIndex = Math.floor(Math.random() * shuffledPlaylist.length); // Começa em índice aleatório
const musicElement = document.getElementById('backgroundMusic');
const playingMusicElement = document.getElementById('playingMusic');
let muted = false;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playRandomMusic() {
    if (currentMusicIndex >= shuffledPlaylist.length) {
        shuffledPlaylist = shuffleArray(playlist.slice()); // Re-embaralha quando todas as músicas forem tocadas
        currentMusicIndex = 0;
    }

    const selectedMusic = shuffledPlaylist[currentMusicIndex];
    currentMusicIndex++; // Avança para a próxima música

    document.getElementById('musicSource').src = selectedMusic.src;
    let title = selectedMusic.title;
    if (title.length > 20) {
        playingMusicElement.textContent = title.substring(0, 20) + "...";
    } else {
        playingMusicElement.textContent = title;
    }

    musicElement.load();
    musicElement.volume = 0;
    musicElement.play().catch(err => {
        console.error("Falha ao iniciar a música:", err);
    });

    let volume = 0;
    const interval = setInterval(() => {
        if (!muted) {
            if (volume < 0.4) {
                volume += 0.01;
                musicElement.volume = volume;
            } else {
                clearInterval(interval);
            }
        } else {
            musicElement.volume = 0;
            clearInterval(interval);
        }
    }, 100);
}

musicElement.addEventListener('ended', playRandomMusic);
playRandomMusic();
let isGameRunning = false;
window.electron.on('gta-process-status', async (isRunning, gameFolder) => {
    $("#gameFolderInput").val(gameFolder);
    $("#openGameFolder").attr("disabled", false);
    $("#openGameFolder").attr("onclick", `openGameFolder()`);
    isGameRunning = isRunning;
    const playSampButton = document.getElementById('play-samp');
    const playingNowElement = document.getElementById("playing_now");

    if (isRunning) {
        if (!playSampButton.hasAttribute("disabled")) {
            playSampButton.setAttribute("disabled", true);
        }
        if (!playSampButton.classList.contains("disabled")) {
            playSampButton.classList.add("disabled");
        }

        if (playingNowElement.style.display !== "flex") {
            playingNowElement.style.display = "flex";
        }
    } else {
        document.getElementById("selectedservernum").innerHTML = `#${server_selected}`;

        if (playSampButton.hasAttribute("disabled")) {
            playSampButton.removeAttribute("disabled");
        }
        if (playSampButton.classList.contains("disabled")) {
            playSampButton.classList.remove("disabled");
        }

        if (playingNowElement.style.display !== "none") {
            playingNowElement.style.display = "none";
        }
    }
});

let updatingGame = false;
let updatingLauncher = false;
window.electron.on('game-needs-update', (needsUpdate, currentVersion, latestVersion) => {
    if(!updatingGame) {
        if(document.getElementById("update_launcher_container").style.display != "flex") {
            document.getElementById("currentVersion").innerHTML = `Versão ${currentVersion}`;
            if(currentVersion == 0) {
                document.getElementById("latestVersion").innerHTML = `Clique para instalar v${latestVersion}!`;
                $("#updateButtonText").text("INSTALAR");
            } else {
                document.getElementById("latestVersion").innerHTML = `Versão atual: ${currentVersion} | Atualização ${latestVersion} disponível!`;
                $("#updateButtonText").text("ATUALIZAR");
            }
            if(needsUpdate) {
                document.getElementById("update_game_container").style.display = "flex";
                document.getElementById("play_game_container").style.display = "none";
                $("#latestVersion").show();
                $("#currentVersion").hide();
            } else {
                document.getElementById("update_game_container").style.display = "none";
                document.getElementById("play_game_container").style.display = "flex";
                $("#latestVersion").hide();
                $("#currentVersion").show();
            }
        } else {
            document.getElementById("play_game_container").style.display = "none";
        }
    }
});
window.electron.send('getAutoLaunchStatus')
latestLauncherVersion = 0;
window.electron.on('launcher-needs-update', (needsUpdate, currentVersion, latestVersion) => {
    if(document.getElementById("update_launcher_container").style.display != "flex") {
        if(!updatingLauncher) {
            latestLauncherVersion = latestVersion;
            $("#launcherVersionSettings").text(currentVersion);
            $("#launcherVersion").text(currentVersion);
                // console.log(`Launcher atual: ${currentVersion} | Última versao ${latestVersion}!`);
            document.getElementById("latestLauncherVersion").innerHTML = `Launcher atual: ${currentVersion} | Atualização ${latestVersion} disponível!`;
            if(needsUpdate) {
                document.getElementById("update_game_container").style.display = "none";
                document.getElementById("play_game_container").style.display = "none";
                document.getElementById("update_launcher_container").style.display = "flex";
                $("#latestLauncherVersion").show();
                $("#currentVersion").hide();
            } else {
                document.getElementById("update_launcher_container").style.display = "none";
                $("#latestLauncherVersion").hide();
                $("#currentVersion").show();
            }
        }
    } else {
        document.getElementById("play_game_container").style.display = "none";
    }
});
let updateButton = document.getElementById('updateButton');
if(updateButton) {
    updateButton.addEventListener('click', () => {
        updateButton.setAttribute("disabled", true);
        updateButton.classList.add("disabled");
        $("#latestVersion").hide();
        document.getElementById('progressBar').style.display = "flex";
        updatingGame = true;
        $("#latestVersion").hide();
        $("#currentVersion").hide();
        window.electron.send('start-download');
    });
}

let updateLauncherButton = document.getElementById('updateLauncherButton');
let updateLauncherButtonProcessing = document.getElementById('updateLauncherButtonProcessing');
if(updateLauncherButton) {
    updateLauncherButton.addEventListener('click', () => {
        updateLauncherButtonProcessing.setAttribute("disabled", true);
        updateLauncherButtonProcessing.classList.add("disabled");
        $("#updateLauncherButton").hide();
        $("#updateLauncherButtonProcessing").show();
        $("#progressBarLauncher").show();
        const progressCounting = document.getElementById('progressCountingLauncher');
        const progressBar = document.getElementById('progressBarLauncher');

        document.getElementById("latestLauncherVersion").innerHTML = `Aguarde enquanto atualizamos seu launcher para a v${latestLauncherVersion}!`;
        document.getElementById("progressLabelLauncher").innerHTML = `INSTALANDO ATUALIZAÇÃO`;
        window.electron.send('start-download-launcher');
        updatingLauncher = true;
    });
}

window.electron.on('download-progress', (percent, extracting) => {
    const progressCounting = document.getElementById('progressCounting');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressLabel = document.getElementById('progressLabel');
    const musicElement = document.getElementById('backgroundMusic');

    if (extracting) {
        progressLabel.textContent = "Extraindo arquivos";
    } else {
        progressLabel.textContent = "Fazendo download";
    }

    progressCounting.style.width = percent + '%';
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = percent + '%';
    if(percent >= 99) {
        updatingGame = false;
        musicElement.stop();
    }
});


window.electron.on('download-progress-launcher', (percent) => {
    const progressCounting = document.getElementById('progressCountingLauncher');
    const progressBar = document.getElementById('progressBarLauncher');
    console.log("Porcentagem do download: "+percent)
    progressCounting.style.width = percent + '%';
    progressBar.setAttribute('aria-valuenow', percent);
});

window.electron.on('show-username-modal', async () => {
    try {
        const { value: username } = await Swal.fire({
            title: "Nome de usuário",
            input: "text",
            html: "Digite um nome de usuário <b class='text-primary'>válido</b>!<br><br><span class='text-primary'>Exemplo:</span> <b>Nome_Sobrenome</b>",
            confirmButtonText: "CONFIRMAR",
            inputPlaceholder: "Nome_Sobrenome",
            inputAttributes: {
                maxlength: "32",
                autocapitalize: "off",
                autocorrect: "off"
            },
            preConfirm: (username) => {
                if (!username) {
                    Swal.showValidationMessage("O nome de usuário não pode estar vazio!");
                    return false;
                }
                const regex = /^Nome_Sobrenome$/i;
                if (regex.test(username)) {
                    Swal.showValidationMessage("O nome de usuário 'Nome_Sobrenome' não é permitido!");
                    return false;
                }
            }
        });

        if (username) {
            window.electron.send('edit-username', username);
            document.getElementById('volume_on').style.display = "block";
            document.getElementById('volume_off').style.display = "none";
            muted = false;
            document.getElementById('backgroundMusic').volume = 0.5;
            window.electron.send('play-samp', server_selected);
        }
    } catch (error) {
        console.error("Erro ao exibir o modal:", error);
    }
});
const changeAutoLaunchButton = document.getElementById('changeAutoLaunchButton');

changeAutoLaunchButton.addEventListener('click', () => {
    let toggle = (changeAutoLaunchButton.checked ? true : false);
    console.log(toggle)
    window.electron.send('toggleAutoLaunch', toggle)
});

window.electron.on('autoLaunchStatus', (status) => {
    console.log(`Status do autolaunch: ${status}`)
    if(status) {
        $("#changeAutoLaunchButton").checked = true;
        $("#changeAutoLaunchButton").attr("checked", "true");
    } else {
        $("#changeAutoLaunchButton").checked = false;
        $("#changeAutoLaunchButton").removeAttr("checked");
    }
});

document.querySelectorAll('[data-server-select]').forEach(card => {
    card.addEventListener('click', function() {
        const server_selected = this.getAttribute("data-server-select");
        document.querySelectorAll('.card_server_option').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        window.electron.send('set-server', server_selected);
    });
});

window.electron.send('start-check-gta-process');
window.electron.send('start-check-update');
window.electron.send('start-check-launcher-update');
AOS.init();
window.electron.on('checkSelectedServer', async (server, username, serverInfo) => {
    if(server == server_selected) return true;
    $("#loadingscreen").fadeIn();

    old_server_selected = server_selected;
    server_selected = server;

    document.querySelectorAll("[data-aos]").forEach(el => {
        el.classList.remove("aos-animate");
    });

    $("#titleContent").fadeOut(100, function() {
        $("#picture_sv1").hide();
        $("#picture_sv2").hide();
        $("#picture_sv3").hide();
        $("#picture_sv4").hide();
        $("#picture_sv" + server_selected).fadeIn(250);
        document.body.style.backgroundImage = `${serverInfo.background}`;
        document.getElementById("card_server_" + server).classList.add("active");
        document.getElementById("servertitlenum").innerHTML = `${server}`;
        document.getElementById("playerName").value = username;
        document.getElementById("onlineNowTitle").innerHTML = serverInfo.online;
        document.getElementById("onlineNow").innerHTML = serverInfo.online;

        $("#server_site_button").attr("onclick", `openLink("https://horizonte-rp.com")`)
        $("#server_loja_button").attr("onclick", `openLink("https://horizonte-rp.com/comprar_hzcoins")`)
        $("#server_insta_button").attr("onclick", `openLink("https://instagram.com/horizontegamesrp")`)
        $("#server_discord_button").attr("onclick", `openLink("${serverInfo.discord}")`)
        $("#server_youtube_button").attr("onclick", `openLink("https://www.youtube.com/@horizonterp")`)
        $("#server_tiktok_button").attr("onclick", `openLink("https://www.tiktok.com/@horizontegamesrp")`)
        $("#titleContent").fadeIn(250);

        fetch(`https://horizonte-rp.com/api/launcher/getNoticias/${server_selected}`)
        .then(response => response.json())
        .then(data => {
            const noticiasContainer = document.getElementById('noticiasContainer');
            noticiasContainer.innerHTML = '';
            let noticias = 1;
            if(data.length == 0) {
                return true;
            } else {
                data.forEach(noticia => {
                    if(noticias > 2) return true;
                    const noticiaconteudo = noticia.conteudo.substring(0, 90) + "...";
                    const noticiaCard = `
                    <div class="col-6">
                    <div style="background-image: linear-gradient(to top, #041925, transparent), url(${noticia.imagem});" class="card_news rounded">
                    <span class="card_news_title">${noticia.nome}</span>
                    <span class="card_news_text">${noticiaconteudo}</span>
                    </div>
                    </div>
                    `;
                    noticiasContainer.innerHTML += noticiaCard;
                    noticias++;
                });
            }
        })
        .catch(error => {
            console.error('Erro ao buscar notícias:', error);
        });

        AOS.refresh();
    });
    $("#loadingscreen").fadeOut();
});
})
.catch(error => {
    console.error('Error loading the page:', error);
});
}

loadPage('home.html');

particlesJS('particles-js', {
    "particles": {
        "number": {
            "value": 160,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#bbc6ff"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#bbc6ff"
            },
            "polygon": {
                "nb_sides": 5
            },
            "image": {
                "src": "https://horizonte-rp.com/assets/img/hzcoin_alt.png",
                "width": 500,
                "height": 500
            }
        },
        "opacity": {
            "value": 0.5,
            "random": true,
            "anim": {
                "enable": true,
                "speed": 1,
                "opacity_min": 0,
                "sync": false
            }
        },
        "size": {
            "value": 2,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 4,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": false,
            "distance": 150,
            "color": "#bbc6ff",
            "opacity": 0.6,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 1,
            "direction": "none",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 600
            }
        }
    },
    "retina_detect": true
});
