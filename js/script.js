console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// Convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch songs from the folder
async function getSongs(folder) {
    currFolder = folder;
    let response = await fetch(`/${folder}/`);
    let text = await response.text();
    
    let div = document.createElement("div");
    div.innerHTML = text;
    
    let anchors = div.getElementsByTagName("a");
    songs = [];

    for (let anchor of anchors) {
        let href = anchor.href;
        if (href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(href.split(`/${folder}/`)[1]));
        }
    }

    // Show songs in playlist
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`;
    }

    // Attach event listener to each song
    Array.from(document.querySelectorAll(".songList li")).forEach((element, index) => {
        element.addEventListener("click", () => playMusic(songs[index]));
    });

    return songs;
}

// Play selected music
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;

    currentSong.addEventListener("loadedmetadata", () => {
        document.querySelector(".songtime").innerHTML = 
            `00:00 / ${secondsToMinutesSeconds(currentSong.duration)}`;
    });

    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
};


// Fetch and display album folders
async function displayAlbums() {
    console.log("Displaying albums...");
    let response = await fetch(`/songs/`);
    let text = await response.text();

    let div = document.createElement("div");
    div.innerHTML = text;
    
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (let anchor of anchors) {
        let href = anchor.href;
        if (href.includes("/songs") && !href.includes(".htaccess")) {
            let folder = href.split("/").slice(-2)[1];

            try {
                let metaResponse = await fetch(`/songs/${folder}/info.json`);
                let metadata = await metaResponse.json();

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${metadata.title}</h2>
                        <p>${metadata.description}</p>
                    </div>`;
            } catch (error) {
                console.error(`Error loading album: ${folder}`);
            }
        }
    }

    // Load playlist when album is clicked
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            console.log("Fetching Songs...");
            songs = await getSongs(`songs/${card.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

// Next & Previous Button Fix
document.getElementById("next").addEventListener("click", () => {
    let currentIndex = songs.findIndex(song => 
        decodeURIComponent(song) === decodeURIComponent(currentSong.src.split("/").pop())
    );

    if (currentIndex !== -1 && currentIndex + 1 < songs.length) {
        playMusic(songs[currentIndex + 1]);
    }
});

document.getElementById("previous").addEventListener("click", () => {
    let currentIndex = songs.findIndex(song => 
        decodeURIComponent(song) === decodeURIComponent(currentSong.src.split("/").pop())
    );

    if (currentIndex > 0) {
        playMusic(songs[currentIndex - 1]);
    }
});

// Main function
async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    // Play/Pause Button
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "img/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    // Update song time and progress bar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = 
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar functionality
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Volume Control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = e.target.value / 100;
        document.querySelector(".volume img").src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    // Mute/Unmute Button
    let lastVolume = 1.0; // Store last volume

    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            lastVolume = currentSong.volume;  // Store current volume
            e.target.src = "img/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = lastVolume;  // Restore previous volume
            document.querySelector(".range input").value = lastVolume * 100;
        }
    });



}

main();
