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


function loadPage(page) {
    console.log(`Carregando a pagina ${page}`)
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

// Manage the play button state
        setInterval(function() {
            const playSampButton = document.getElementById('play-samp');
            if (server_selected === 0) {
                if (playSampButton) {
// document.getElementById("selectedservernumslot").innerHTML = `#${server_selected}`;
                    document.getElementById("selectedservernum").innerHTML = `#${server_selected}`;
                    playSampButton.setAttribute("disabled", true);
                    playSampButton.classList.add("disabled");
                }
            } else {
                if (playSampButton) {
// document.getElementById("selectedservernumslot").innerHTML = `#${server_selected}`;
                    document.getElementById("selectedservernum").innerHTML = `#${server_selected}`;
                    playSampButton.removeAttribute("disabled");
                    playSampButton.classList.remove("disabled");
                }
            }
        }, 10);

        document.getElementById('play-samp').addEventListener('click', () => {
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
            { title: "Let's Go 4 - MC PH", src: "assets/letsgo4.mp3" },
            { title: "MuluBeats - MTG CHIHIRO", src: "assets/chihiro.mp3" },
            { title: "DJ Topo - MTG Quem não quer sou eu", src: "assets/quemnaoquer.mp3" },
            { title: "Hungria - Mais brabo que vovô", src: "assets/maisbrabo.mp3" },
            { title: "Hungria - Chevette do Jacó", src: "assets/chevette.mp3" }
            ];

        let currentMusicIndex = 0;
        const musicElement = document.getElementById('backgroundMusic');
        const playingMusicElement = document.getElementById('playingMusic');
        let muted = false;

        function playRandomMusic() {
            currentMusicIndex = Math.floor(Math.random() * playlist.length);
            const selectedMusic = playlist[currentMusicIndex];
            document.getElementById('musicSource').src = selectedMusic.src;
            var title = selectedMusic.title;
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
                if(!muted) {
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
        window.electron.on('gta-process-status', async (isRunning) => {
            if(isRunning) {
                document.getElementById("playing_now").style.display = "flex";
            } else {
                document.getElementById("playing_now").style.display = "none";
            }
        });
        window.electron.on('game-needs-update', (needsUpdate, currentVersion, latestVersion) => {
            document.getElementById("currentVersion").innerHTML = "Versão "+currentVersion;
            document.getElementById("latestVersion").innerHTML = "Versão "+latestVersion;
            if(needsUpdate) {
                document.getElementById("update_game_container").style.display = "flex";
                document.getElementById("play_game_container").style.display = "none";
            } else {
                document.getElementById("update_game_container").style.display = "none";
                document.getElementById("play_game_container").style.display = "flex";
            }
        });
        let updateButton = document.getElementById('updateButton');
        if(updateButton) {
            updateButton.addEventListener('click', () => {
                updateButton.setAttribute("disabled", true);
                updateButton.classList.add("disabled");
                document.getElementById('progressBar').style.display = "flex";
                window.electron.send('start-download');
            });
        }

        window.electron.on('download-progress', (percent, extracting) => {
            const progressCounting = document.getElementById('progressCounting');
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const progressLabel = document.getElementById('progressLabel');

            if (extracting) {
                progressLabel.textContent = "Extraindo arquivos";
            } else {
                progressLabel.textContent = "Fazendo download";
            }

            progressCounting.style.width = percent + '%';
            progressBar.setAttribute('aria-valuenow', percent);
            progressText.textContent = percent + '%';
            if(percent >= 99) musicElement.stop();
        });

        window.electron.on('show-username-modal', async () => {
            try {
                const { value: username } = await Swal.fire({
                    title: "Nome de usuário",
                    input: "text",
                    html: "Digite um nome de usuário <b>válido</b>!<br>Proibido: <b>Nome_Sobrenome</b>",
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
                    $("#toggleVolume").click();
                    window.electron.send('play-samp', server_selected);
                }
            } catch (error) {
                console.error("Erro ao exibir o modal:", error);
            }
        });

        const servidores = [
            { ip: "ip1.horizonte-rp.com:7777", nome: "Servidor #1", discord: "https://discord.gg/GmrQbRAvrP" },
            { ip: "ip2.horizonte-rp.com:7777", nome: "Servidor #2", discord: "https://discord.gg/zb2RfgwKvJ" },
            { ip: "ip3.horizonte-rp.com:7777", nome: "Servidor #3", discord: "https://discord.gg/wWpzCGwbve" },
            { ip: "ip4.horizonte-rp.com:7777", nome: "Servidor #4", discord: "https://discord.gg/ApWCz9pqqa" },
            ];

        const infos = {
            query: [
                { online: 120, maxplayers: 300 },
                { online: 90, maxplayers: 250 },
                { online: 45, maxplayers: 150 },
                { online: 78, maxplayers: 200 },
                ]
        };

        document.querySelectorAll('[data-server-select]').forEach(card => {
            card.addEventListener('click', function() {
                console.log("clicou no server");
                const server_selected = this.getAttribute("data-server-select");
                document.querySelectorAll('.card_server_option').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                window.electron.send('set-server', server_selected);
                console.log("Servidor selecionado: " + server_selected);
            });
        });

        window.electron.send('start-check-gta-process');
        window.electron.send('start-check-update');
        console.log("enviado start-check-update");
        AOS.init();
        window.electron.on('checkSelectedServer', async (server, username, serverInfo) => {
            if(server == server_selected) return true;
            $("#loadingscreen").fadeIn();
            console.log("Definindo servidor predefinido: " + server);

            old_server_selected = server_selected;
            server_selected = server;

            console.log(serverInfo);

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
