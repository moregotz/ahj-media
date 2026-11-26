import musicFile from '../media/music.mp3';
import videoFile from '../media/swag_chickens.mp4';

export default class Page {
    constructor(container) {
        this.container = container;
        this.currentUser = { id: 'me', name: 'Вы' };
        this.geoData = null;
        this.geoStatus = 'prompt';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;

        this.posts = [
            {
                type: 'text',
                text: 'Дорогой дневник, мне не передать ту боль, которую мне сегодня пришлось пережить...',
                date: '25.11.26 15:30',
            },
            {
                type: 'audio',
                src: musicFile,
                date: '25.11.26 15:32',
            },
            {
                type: 'video',
                src: videoFile,
                date: '25.11.26 15:35',
            },
        ];
    }

    init() {
        this.renderPage();
        this.bindEvents();
        this.requestGeolocation();
    }

    requestGeolocation() {
        if (!navigator.geolocation) {
            this.geoStatus = 'denied';
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.geoData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                this.geoStatus = 'granted';
            },
            () => {
                this.geoStatus = 'denied';
            }
        );
    }

    getGeoString() {
        if (this.geoStatus === 'granted' && this.geoData) {
            return `[${this.geoData.lat.toFixed(5)}, ${this.geoData.lng.toFixed(5)}]`;
        }
        return 'местоположение неизвестно';
    }

    renderPage() {
        this.container.innerHTML = `
            <div class="main_page">
                <div class="feed" id="feed"></div>
                <div class="composer">
                    <input type="text" class="composer__input" id="message-input" placeholder="Напишите что-нибудь..." />
                    <button class="composer__btn send-btn hidden" id="send-btn">➤</button>
                    <button class="composer__btn voice-btn" id="voice-btn">🎙️</button>
                </div>
            </div>
        `;
        this.feed = this.container.querySelector('#feed');
        this.messageInput = this.container.querySelector('#message-input');
        this.sendBtn = this.container.querySelector('#send-btn');
        this.voiceBtn = this.container.querySelector('#voice-btn');
        this.renderTimeline();
    }

    renderTimeline() {
        this.feed.innerHTML = '';
        this.posts.forEach(post => this.feed.appendChild(this.createPostCard(post)));
    }

    createPostCard(post) {
        const card = document.createElement('article');
        card.className = 'post';
        const dot = `<span class="post__dot"></span>`;
        const date = `<div class="post__date">${post.date}</div>`;
        const geo = `<div class="post__geo">${this.getGeoString()} <span class="post__eye">👁</span></div>`;

        let body = '';

        if (post.type === 'text') {
            body = `<div class="post__text">${post.text}</div>`;

        } else if (post.type === 'audio') {
            const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            body = `
                <div class="post__media post__media--audio">
                    <button class="play-btn" data-audio-id="${id}" aria-label="Play"></button>
                    <input type="range" class="slider" min="0" max="100" value="0" data-audio-id="${id}" />
                    <audio src="${post.src}" data-audio-id="${id}" preload="metadata"></audio>
                </div>
            `;

        } else if (post.type === 'video') {
            const id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            body = `
                <div class="post__media post__media--video">
                    <div class="video-box">
                        <video src="${post.src}" data-video-id="${id}" preload="metadata"></video>
                        <button class="play-btn play-btn--center" data-video-id="${id}" aria-label="Play"></button>
                    </div>
                    <input type="range" class="slider" min="0" max="100" value="0" data-video-id="${id}" />
                </div>
            `;
        }

        card.innerHTML = `${dot}<div class="post__card">${date}${body}${geo}</div>`;
        return card;
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.play-btn');
            if (!btn) return;
            if (btn.dataset.audioId) this.toggleAudio(btn.dataset.audioId, btn);
            if (btn.dataset.videoId) this.toggleVideo(btn.dataset.videoId, btn);
        });

        this.container.addEventListener('input', (e) => {
            if (!e.target.classList.contains('slider')) return;
            if (e.target.dataset.audioId) this.seekAudio(e.target.dataset.audioId, e.target.value);
            if (e.target.dataset.videoId) this.seekVideo(e.target.dataset.videoId, e.target.value);
        });

        this.messageInput.addEventListener('input', () => this.toggleSendBtn());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.voiceBtn.addEventListener('click', () => this.toggleRecording());
    }

    toggleAudio(id, btn) {
        const audio = this.container.querySelector(`audio[data-audio-id="${id}"]`);
        if (!audio) return;
        if (audio.paused) {
            audio.play();
            btn.classList.add('playing');
        } else {
            audio.pause();
            btn.classList.remove('playing');
        }
        audio.ontimeupdate = () => {
            const slider = this.container.querySelector(`.slider[data-audio-id="${id}"]`);
            if (slider && audio.duration) slider.value = (audio.currentTime / audio.duration) * 100;
        };
        audio.onended = () => btn.classList.remove('playing');
    }

    seekAudio(id, value) {
        const audio = this.container.querySelector(`audio[data-audio-id="${id}"]`);
        if (audio && audio.duration) audio.currentTime = (value / 100) * audio.duration;
    }

    toggleVideo(id, btn) {
        const video = this.container.querySelector(`video[data-video-id="${id}"]`);
        if (!video) return;
        if (video.paused) {
            video.play();
            btn.classList.add('playing');
            btn.style.opacity = '0';
        } else {
            video.pause();
            btn.classList.remove('playing');
            btn.style.opacity = '1';
        }
        video.ontimeupdate = () => {
            const slider = this.container.querySelector(`.slider[data-video-id="${id}"]`);
            if (slider && video.duration) slider.value = (video.currentTime / video.duration) * 100;
        };
        video.onended = () => {
            btn.classList.remove('playing');
            btn.style.opacity = '1';
        };
    }

    seekVideo(id, value) {
        const video = this.container.querySelector(`video[data-video-id="${id}"]`);
        if (video && video.duration) video.currentTime = (value / 100) * video.duration;
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                this.addAudioPost(url);
                this.audioStream.getTracks().forEach(t => t.stop());
            };
            this.mediaRecorder.start();
            this.isRecording = true;
            this.voiceBtn.classList.add('recording');
            this.voiceBtn.textContent = '⏹';
        } catch (err) {
            console.error('Без доступа к микрофону:', err);
            alert('Не удалось получить доступ к микрофону.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.voiceBtn.classList.remove('recording');
            this.voiceBtn.textContent = '🎙️';
        }
    }

    addAudioPost(src) {
        const newPost = {
            type: 'audio',
            src,
            date: new Date().toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit',
            }),
        };
        this.posts.push(newPost);
        this.feed.appendChild(this.createPostCard(newPost));
    }

    toggleSendBtn() {
        const text = this.messageInput.value.trim();
        this.sendBtn.classList.toggle('hidden', text.length === 0);
    }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;
        const newPost = {
            type: 'text',
            text,
            date: new Date().toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit',
            }),
        };
        this.posts.push(newPost);
        this.feed.appendChild(this.createPostCard(newPost));
        this.messageInput.value = '';
        this.toggleSendBtn();
    }
}