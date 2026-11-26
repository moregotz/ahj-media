import Page from './postpage/page.js';
import './style.css';

const rootContainer = document.getElementById('root');

const page = new Page(rootContainer);

page.init();