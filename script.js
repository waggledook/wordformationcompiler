// Firebase initialization (using ES modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getFirestore, 
  addDoc, 
  collection, 
  serverTimestamp, 
  getDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
// Optionally, import analytics if needed
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpUNy_xjg9IE6K9CIPlYA-f26YuhNQD9c",
  authDomain: "key-word-compiler.firebaseapp.com",
  projectId: "key-word-compiler",
  storageBucket: "key-word-compiler.firebasestorage.app",
  messagingSenderId: "101672648997",
  appId: "1:101672648997:web:908397d03fcebb548f1acc",
  measurementId: "G-QK0FWQQYHV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Now you have access to Firestore
const analytics = getAnalytics(app); // Optional, if you're using analytics

loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", () => {
  console.log("QRCode library loaded!");
});

// Utility functions
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

function loadCSS(url) {
  const link = document.createElement("link");
  link.href = url;
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

// Since we're now using a plain dropdown, we don't need to initialize select2.
// This function can simply be a placeholder (or removed entirely if not needed).
function initTagSelect() {
  document.addEventListener("DOMContentLoaded", function () {
    // No special initialization is required for the plain dropdown.
  });
}

function addCustomSelect2Styles() {
  // No custom styles needed for plain dropdown.
}


loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => {
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js", () => {
    console.log("jsPDF and AutoTable loaded!");
    // Now you can safely call your PDF-generating code, e.g. this.downloadReport()
  });
});


function normalize(text) {
  // 1) Convert curly quotes ’ or ‘ to straight '.
  //    This ensures 'cousin’s' becomes 'cousin's'.
  text = text.replace(/[’‘]/g, "'");


  // 3) Remove punctuation if desired (this will remove commas, periods, etc. 
  //    but leave apostrophes for the 's expansions).
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  // 4) Collapse multiple spaces and trim.
  text = text.replace(/\s{2,}/g, " ").trim();

  // 5) Convert to lowercase.
  text = text.toLowerCase();

  return text;
}

function isAnswerCorrect(userAnswer, acceptedAnswers) {
  const normUser = normalize(userAnswer);
  return acceptedAnswers.some(ans => normalize(ans) === normUser);
}

class WordFormationGame {
  constructor(transformations) {
    this.allTransformations = transformations;
    this.selectedChallenges = [];
    this.score = 0;
    this.initFilterUI();
  }

  initFilterUI() {
    document.body.innerHTML = `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }
        body {
          font-family: 'Poppins', sans-serif;
          color: white;
          text-align: center;
          background: linear-gradient(135deg, #2E3192, #1BFFFF) no-repeat center center fixed;
          background-size: cover;
        }
        #filter-container {
          max-width: 600px;
          margin: auto;
          background: rgba(0,0,0,0.8);
          padding: 30px 20px;
          border-radius: 10px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          margin-top: 5%;
        }
        /* New title container to fit the game box */
        #title-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        #menu-image {
          max-width: 75%; /* Scales with the container */
          height: auto;
        }
        #title-container h1 {
          font-size: 2em; /* Adjust as needed */
          margin-top: 10px;
        }
        #filter-container h1 {
          margin-bottom: 20px;
          font-size: 2em;
          text-shadow: 1px 1px 5px rgba(0,0,0,0.5);
        }
        #filter-container p {
          margin: 10px 0 5px;
          font-weight: 600;
        }
        #filter-container button {
          padding: 12px 24px;
          font-size: 16px;
          margin: 10px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          transition: background 0.3s ease, transform 0.2s ease;
        }
        #filter-container button:hover {
          background: linear-gradient(135deg, #FFA500, #FFD700);
          transform: translateY(-2px);
        }
        #filter-container button:active {
          transform: translateY(1px);
        }
        /* Styles for level checkboxes */
        #levelCheckboxes {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        #levelCheckboxes label {
          font-size: 16px;
        }
        /* Shared styles for both select elements */
        #filter-container select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: #333;
          color: #fff;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 0.5em 2.5em 0.5em 0.5em;
          font-size: 16px;
          cursor: pointer;
          outline: none;
          background-image: url("data:image/svg+xml,%3Csvg fill='%23FFF' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75em center;
          background-size: 1em;
          width: 60%;
        }
        #filter-container select:focus {
          border-color: #999;
        }
        /* Styles for the tag search input */
        #tagSearch {
          margin-bottom: 10px;
          padding: 0.5em;
          width: 60%;
          font-size: 16px;
          border: 1px solid #555;
          border-radius: 4px;
          background-color: #333;
          color: #fff;
          outline: none;
        }
        #addTagBtn {
          background: linear-gradient(135deg, #FFFFFF 0%, #C0C0C0 50%, #E5E4E2 100%) !important;
          color: #000;
          padding: 12px 24px;
          font-size: 16px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease;
        }
        #addTagBtn:hover {
          background: linear-gradient(135deg, #E5E4E2 0%, #C0C0C0 50%, #FFFFFF 100%) !important;
          transform: translateY(-2px);
        }
        #addTagBtn:active {
          transform: translateY(1px);
        }
      </style>
      <div id="filter-container">
        <!-- Title container with image, game title and title text -->
        <div id="title-container">
          <img id="menu-image" src="images/key-puzzle.png" alt="Word Formation Game">
        </div>

        <p>Select Level(s):</p>
        <div id="levelCheckboxes">
          <label><input type="checkbox" value="B1" checked> B1</label>
          <label><input type="checkbox" value="B2" checked> B2</label>
          <label><input type="checkbox" value="C1" checked> C1</label>
          <label><input type="checkbox" value="C2" checked> C2</label>
        </div>
        <p>Select Tag:</p>
        <input type="text" id="tagSearch" placeholder="Search tags...">
        <select id="tagSelect">
          <option value="all">All Tags</option>
        </select>
        <!-- New "Add Tag" button -->
        <button id="addTagBtn">Add Tag?</button>
        <!-- Container for the additional tag dropdown (hidden by default) -->
        <div id="additionalTagContainer" style="display:none;">
          <p>Select Additional Tag:</p>
          <select id="secondaryTagSelect">
            <option value="none">None</option>
          </select>
        </div>
        <br>
        <button id="startGameBtn">Start Game</button>
      </div>
    `;
    
    // Attach listeners for level checkboxes
    const checkboxes = document.querySelectorAll("#levelCheckboxes input[type='checkbox']");
    checkboxes.forEach(chk => {
      chk.addEventListener("change", () => this.updateTagOptions());
    });

    // Attach listener for the "Add Tag?" button to toggle the secondary tag dropdown
    document.getElementById("addTagBtn").addEventListener("click", () => {
      const container = document.getElementById("additionalTagContainer");
      if (container.style.display === "none") {
        container.style.display = "block";
        this.updateSecondaryTagOptions(); // Populate the secondary tag dropdown
      } else {
        container.style.display = "none";
      }
    });

    // Attach listener to update secondary tag options when the primary tag changes
    document.getElementById("tagSelect").addEventListener("change", () => this.updateSecondaryTagOptions());

    // Attach the start game button listener
    document.getElementById("startGameBtn").addEventListener("click", () => this.startGame());
    
    // Initialize the tag options
    this.updateTagOptions();
    
    document.getElementById("tagSearch").addEventListener("input", function() {
      const filter = this.value.toLowerCase();
      const tagSelect = document.getElementById("tagSelect");
      // Rebuild the options list using the full tag array
      tagSelect.innerHTML = `<option value="all">All Tags</option>`;
      // Use the stored array from the game instance; assuming "game" is your instance
      const fullTags = game.fullTagArray || [];
      fullTags.forEach(tag => {
        if (tag.toLowerCase().includes(filter)) {
          const option = document.createElement("option");
          option.value = tag;
          option.textContent = tag;
          tagSelect.appendChild(option);
        }
      });
    });
  }

  updateTagOptions() {
  const checkboxes = document.querySelectorAll("#levelCheckboxes input[type='checkbox']");
  let selectedLevels = Array.from(checkboxes)
    .filter(chk => chk.checked)
    .map(chk => chk.value.toLowerCase());
  if (selectedLevels.length === 0) {
    selectedLevels = ["b1", "b2", "c1", "c2"];
  }

  // Filter transformations based on selected levels.
  let relevant = this.allTransformations.filter(t => {
    let tags = t.tags.split(",").map(s => s.trim().toLowerCase());
    return selectedLevels.some(level => tags.includes(level));
  });

  // Build a set of non-level tags.
  let tagSet = new Set();
  relevant.forEach(t => {
    t.tags.split(",")
      .map(s => s.trim().toLowerCase())
      .filter(s => s && !["b1", "b2", "c1", "c2"].includes(s))
      .forEach(tag => tagSet.add(tag));
  });

  const tagArray = Array.from(tagSet).sort();

  // Save the full tag array for later use.
  this.fullTagArray = tagArray;

  const tagSelect = document.getElementById("tagSelect");
  tagSelect.innerHTML = `<option value="all">All Tags</option>`;
  tagArray.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagSelect.appendChild(option);
  });
}

updateSecondaryTagOptions() {
  const primaryTag = document.getElementById("tagSelect").value;
  // If the primary tag is "all", hide the secondary dropdown.
  if (primaryTag === "all") {
    document.getElementById("additionalTagContainer").style.display = "none";
    return;
  }
  
  // Get the selected levels.
  const checkboxes = document.querySelectorAll("#levelCheckboxes input[type='checkbox']");
  let selectedLevels = Array.from(checkboxes)
    .filter(chk => chk.checked)
    .map(chk => chk.value.toLowerCase());
  if (selectedLevels.length === 0) {
    selectedLevels = ["b1", "b2", "c1", "c2"];
  }
  
  // Filter transformations that have the primary tag.
  let relevant = this.allTransformations.filter(t => {
    let tags = t.tags.split(",").map(s => s.trim().toLowerCase());
    return selectedLevels.some(level => tags.includes(level)) &&
           tags.includes(primaryTag.toLowerCase());
  });
  
  // Build a set of additional tags from these transformations (excluding levels and the primary tag).
  let tagSet = new Set();
  relevant.forEach(t => {
    t.tags.split(",")
      .map(s => s.trim().toLowerCase())
      .forEach(tag => {
        if (tag && !["b1", "b2", "c1", "c2"].includes(tag) && tag !== primaryTag.toLowerCase()) {
          tagSet.add(tag);
        }
      });
  });
  
  const tagArray = Array.from(tagSet).sort();
  
  // Populate the secondary tag select element.
  const secondarySelect = document.getElementById("secondaryTagSelect");
  secondarySelect.innerHTML = `<option value="none">None</option>`;
  tagArray.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    secondarySelect.appendChild(option);
  });
}

  startGame() {
  const checkboxes = document.querySelectorAll("#levelCheckboxes input[type='checkbox']");
  let selectedLevels = Array.from(checkboxes)
    .filter(chk => chk.checked)
    .map(chk => chk.value.toLowerCase());
  if (selectedLevels.length === 0) {
    selectedLevels = ["b1", "b2", "c1", "c2"];
  }
  
  let filtered = this.allTransformations.filter(t => {
    let tags = t.tags.split(",").map(s => s.trim().toLowerCase());
    return selectedLevels.some(level => tags.includes(level));
  });
  
  // Filter by primary tag if one is selected.
  const primaryTag = document.getElementById("tagSelect").value;
  if (primaryTag !== "all") {
    filtered = filtered.filter(t => {
      let tags = t.tags.split(",").map(s => s.trim().toLowerCase());
      return tags.includes(primaryTag.toLowerCase());
    });
  }
  
  // Additionally filter by the secondary tag if the dropdown is visible and a valid tag is chosen.
  const secondarySelect = document.getElementById("secondaryTagSelect");
  if (secondarySelect && secondarySelect.style.display !== "none") {
    const secondaryTag = secondarySelect.value;
    if (secondaryTag && secondaryTag !== "none") {
      filtered = filtered.filter(t => {
        let tags = t.tags.split(",").map(s => s.trim().toLowerCase());
        return tags.includes(secondaryTag.toLowerCase());
      });
    }
  }
  
  if (filtered.length === 0) {
    alert("No challenges found for the selected filters.");
    return;
  }
  
  this.currentPool = filtered;
  this.selectedChallenges = this.shuffle(filtered).slice(0, 8);
  this.score = 0;
  this.initGameUI();
}

shareSet() {
  // Get the current set of challenges to share
  const setToShare = this.selectedChallenges;

  // Add the set to Firestore
  addDoc(collection(db, "sharedSets"), {
    set: setToShare,
    createdAt: serverTimestamp()
  })
  .then(docRef => {
    // Construct the shareable URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`;

    // Get the container for the QR code and link
    const qrContainer = document.getElementById("qrCodeContainer");
    // Clear any previous content
    qrContainer.innerHTML = "";

    // Create a styled box for the QR code, centered content
    qrContainer.insertAdjacentHTML('beforeend', `
      <div style="
        margin-top: 20px; 
        padding: 20px; 
        background-color: rgba(0, 0, 0, 0.7); 
        border-radius: 10px; 
        text-align: center;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;
      ">
        <p style="font-size:1.2em; margin-bottom: 10px;">
          Scan this QR code to play the set:
        </p>
        <div id="qrCodeBox" style="display: inline-block;"></div>
        <p style="margin-top: 10px; font-size:14px;">
          <a href="${shareUrl}" target="_blank" style="color: white; text-decoration: underline;">
            ${shareUrl}
          </a>
        </p>
      </div>
    `);

    // Now generate the QR code inside the #qrCodeBox
    const qrCodeBox = document.getElementById("qrCodeBox");
    new QRCode(qrCodeBox, {
      text: shareUrl,
      width: 128,
      height: 128
    });
  })
  .catch(error => {
    console.error("Error sharing set: ", error);
  });
}

  checkForSharedSet() {
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('shareId');
  if (shareId) {
    getDoc(doc(db, "sharedSets", shareId))
      .then(docSnap => {
        if (docSnap.exists()) {
          const sharedSet = docSnap.data().set;
          console.log("Shared set:", sharedSet);
          // For example, you might want to instantiate your game with this set:
          this.selectedChallenges = sharedSet;
          this.initGameUI();
        } else {
          console.log("No shared set found with this ID.");
        }
      })
      .catch(error => {
        console.error("Error fetching shared set: ", error);
      });
  }
}

  initGameUI() {
  let challengesHTML = "";
  
  this.selectedChallenges.forEach((challenge, index) => {
    // Use the gapped sentence directly.
    let displayedSentence = challenge.gappedSentence;
    
    // Extract the level tag from challenge.tags (B1, B2, C1, C2)
    let levelTag = challenge.tags
      .split(",")
      .map(s => s.trim().toLowerCase())
      .find(t => t === "b1" || t === "b2" || t === "c1" || t === "c2");

    // For now we simply display the level tag.
    let displayLevel = "";
    if (levelTag === "b1") {
      displayLevel = "B1";
    } else if (levelTag === "b2") {
      displayLevel = "B2";
    } else if (levelTag === "c1") {
      displayLevel = "C1";
    } else if (levelTag === "c2") {
      displayLevel = "C2";
    }
    
    challengesHTML += `
      <div class="challenge" style="margin-bottom:20px; padding:10px; background: rgba(0,0,0,0.6); border-radius:5px;">
        <!-- Display the gapped sentence -->
        <p class="sentence">${displayedSentence}</p>

        <!-- Display the base word -->
        <p class="base" style="font-size:1.5em; font-weight:bold;">
          <span class="base-label" style="color: #235a8c;">Base word:</span>
          <span class="base-value" style="color: #FFD700;">${challenge.base}</span>
        </p>

        <!-- Optionally display the level info -->
        <p class="level-info"><strong style="color: #FF5733;">(${displayLevel})</strong></p>

        <input type="text" id="answer-${index}" placeholder="Enter the correct form" autocomplete="off">
        <button id="submit-${index}">Submit Answer</button>
        <p id="feedback-${index}" style="margin:5px 0;"></p>
      </div>
    `;
  });
    
  document.body.innerHTML = `
    <style>
      body {
        font-family: 'Poppins', sans-serif;
        background: linear-gradient(135deg, #2E3192, #1BFFFF);
        color: white;
        text-align: center;
        margin: 0;
        padding: 20px;
      }
      #game-container {
        max-width: 600px;
        margin: auto;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 10px;
      }
      #title-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 1px;
      }
      #challenge-image {
        max-width: 70%;
        height: auto;
      }
      input, button {
        padding: 10px;
        font-size: 16px;
        margin: 10px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
      }
      input[type="text"] {
        width: 80%;
      }
      .highlight {
        font-weight: bold;
        color: #FFD700;
      }
      /* FEEDBACK CLASSES */
      .submitted-correct {
        background-color: #d4edda;
        color: #155724;
      }
      .submitted-incorrect {
        background-color: #f8d7da;
        color: #721c24;
      }
      .correct-feedback {
        font-weight: bold;
        color: green;
      }
      .incorrect-feedback {
        font-weight: bold;
        color: red;
      }
      /* BUTTON STYLES */
      #downloadReport {
        background: linear-gradient(135deg, #FFA500, #FFD700);
        color: #000;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      #downloadReport:hover {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        transform: translateY(-2px);
      }
      #downloadReport:active {
        transform: translateY(1px);
      }
      #reviewMistakes {
        background: linear-gradient(135deg, #32CD32, #228B22);
        color: #fff;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      #reviewMistakes:hover {
        background: linear-gradient(135deg, #228B22, #32CD32);
        transform: translateY(-2px);
      }
      #reviewMistakes:active {
        transform: translateY(1px);
      }
      .challenge button {
        background: linear-gradient(135deg, #80cbc4, #4db6ac);
        color: #000;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      .challenge button:hover {
        background: linear-gradient(135deg, #4db6ac, #80cbc4);
        transform: translateY(-2px);
      }
      .challenge button:active {
        transform: translateY(1px);
      }
      #regenerateBtn,
      #mainMenuBtn {
        background: linear-gradient(135deg, #FFA500, #FFD700);
        color: #000;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      #regenerateBtn:hover,
      #mainMenuBtn:hover {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        transform: translateY(-2px);
      }
      #regenerateBtn:active,
      #mainMenuBtn:active {
        transform: translateY(1px);
      }
      #shareSetBtn {
        background: linear-gradient(135deg, #FF69B4, #8A2BE2);
        color: #fff;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      #shareSetBtn:hover {
        background: linear-gradient(135deg, #8A2BE2, #FF69B4);
        transform: translateY(-2px);
      }
      #shareSetBtn:active {
        transform: translateY(1px);
      }
      /* In the UI markup (inside your game container, along with your other buttons) */
      <!- (Note: ensure the HTML comment syntax is correct if needed) ->
      <button id="shareSetBtn">Share Set</button>
    </style>
    <div id="game-container">
      <!-- Title container with the new image fixed to the game box -->
      <div id="title-container">
        <img id="challenge-image" src="images/key-puzzle-challenge.png" alt="Word Formation Challenge">
      </div>
      ${challengesHTML}
      <p>Score: <span id="score">0</span></p>
      <button id="downloadReport">Download Report</button>
      <button id="reviewMistakes">Review Mistakes</button>
      <button id="regenerateBtn">Regenerate Sentences</button>
      <button id="mainMenuBtn">Main Menu</button>
      <button id="shareSetBtn">Share Set</button>
      <!-- Container for the QR Code -->
      <div id="qrCodeContainer" style="margin-top:20px;"></div>
    </div>
  `;

  // Attach event listeners for downloadReport and reviewMistakes.
  document.getElementById("downloadReport").addEventListener("click", () => this.downloadReport());
  document.getElementById("reviewMistakes").addEventListener("click", () => this.reviewMistakes());

  // Attach submit logic for each challenge.
  this.selectedChallenges.forEach((_, index) => {
    const submitBtn = document.getElementById(`submit-${index}`);
    const inputEl = document.getElementById(`answer-${index}`);
    submitBtn.addEventListener("click", () => this.checkAnswer(index));
    inputEl.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.checkAnswer(index);
      }
    });
  });
  
  // NEW LISTENERS:
  document.getElementById("regenerateBtn").addEventListener("click", () => {
    // Assumes that this.currentPool was saved in startGame() after filtering.
    this.selectedChallenges = this.shuffle(this.currentPool).slice(0, 8);
    this.score = 0;
    this.initGameUI();
  });

  document.getElementById("mainMenuBtn").addEventListener("click", () => {
    this.initFilterUI();
  });

  document.getElementById("shareSetBtn").addEventListener("click", () => {
    this.shareSet();
  });

  // Attach listeners for downloadReport and reviewMistakes again if needed.
  document.getElementById("downloadReport").addEventListener("click", () => this.downloadReport());
  document.getElementById("reviewMistakes").addEventListener("click", () => this.reviewMistakes());
}

checkAnswer(index) {
  const inputEl = document.getElementById(`answer-${index}`);
  // Prevent re-submission if already disabled.
  if (inputEl.disabled) return;
  
  const userAnswer = inputEl.value;
  const challenge = this.selectedChallenges[index];
  
  // Use the answer property from your word formation data.
  // If it's an array, use it; otherwise, split by '/'
  let acceptedAnswers = Array.isArray(challenge.answer)
    ? challenge.answer
    : challenge.answer.split('/').map(a => a.trim());
    
  const feedbackEl = document.getElementById(`feedback-${index}`);
  
  if (isAnswerCorrect(userAnswer, acceptedAnswers)) {
    feedbackEl.textContent = "Correct!";
    feedbackEl.classList.add("correct-feedback");
    inputEl.classList.add("submitted-correct");
    this.score += 1;
    challenge.wasCorrect = true;
  } else {
    feedbackEl.textContent = "Incorrect. Correct answer: " + acceptedAnswers.join(" / ");
    feedbackEl.classList.add("incorrect-feedback");
    inputEl.classList.add("submitted-incorrect");
    challenge.wasCorrect = false;
  }
  
  // Record the player's answer.
  challenge.userAnswer = userAnswer;
  
  document.getElementById("score").textContent = this.score;
  
  // Disable input and button for this challenge.
  inputEl.disabled = true;
  document.getElementById(`submit-${index}`).disabled = true;
}

downloadReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Build rows for the PDF table: each row contains challenge data.
  let tableRows = [];
  this.selectedChallenges.forEach((challenge, index) => {
    tableRows.push([
      index + 1,
      challenge.gappedSentence,
      challenge.base,
      challenge.userAnswer || "",
      Array.isArray(challenge.answer) ? challenge.answer.join(" / ") : challenge.answer,
      challenge.wasCorrect ? "Correct" : "Incorrect"
    ]);
  });

  // Add a title to the PDF
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 150);
  doc.text("Word Formation Game Report", 14, 20);

  // Build the table using AutoTable with conditional styling for the "Your Answer" column
  doc.autoTable({
    startY: 30,
    head: [["#", "Gapped Sentence", "Base Word", "Your Answer", "Correct Answer", "Result"]],
    body: tableRows,
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    bodyStyles: { fillColor: [216, 216, 216], textColor: 0 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10, cellPadding: 3 },
    didParseCell: function(data) {
      if (data.column.index === 3) { // "Your Answer" column
        let result = data.row.raw[5]; // "Result" column value
        if (result === "Correct") {
          data.cell.styles.textColor = [0, 128, 0]; // green
        } else if (result === "Incorrect") {
          data.cell.styles.textColor = [255, 0, 0]; // red
        }
      }
    }
  });

  // Save the PDF document
  doc.save("Word_Formation_Game_Report.pdf");
}
reviewMistakes() {
  // Filter challenges answered incorrectly
  const mistakes = this.selectedChallenges.filter(challenge => !challenge.wasCorrect);
  if (mistakes.length === 0) {
    alert("No mistakes to review!");
    return;
  }
  
  let reviewHTML = "";
  
  // Build the HTML for each mistaken challenge, using the same style as initGameUI
  mistakes.forEach((challenge, index) => {
    // Use the gapped sentence directly.
    let displayedSentence = challenge.gappedSentence;
    
    // Extract the level tag from challenge.tags (B1, B2, C1, C2)
    let levelTag = challenge.tags
      .split(",")
      .map(s => s.trim().toLowerCase())
      .find(t => t === "b1" || t === "b2" || t === "c1" || t === "c2");
    
    // For now we simply display the level tag.
    let displayLevel = "";
    if (levelTag === "b1") {
      displayLevel = "B1";
    } else if (levelTag === "b2") {
      displayLevel = "B2";
    } else if (levelTag === "c1") {
      displayLevel = "C1";
    } else if (levelTag === "c2") {
      displayLevel = "C2";
    }
    
    reviewHTML += `
      <div class="challenge" style="margin-bottom:20px; padding:10px; background: rgba(0,0,0,0.6); border-radius:5px;">
        <p class="sentence">${displayedSentence}</p>
        <p class="base" style="font-size:1.5em; font-weight:bold;">
          <span class="base-label" style="color: #235a8c;">Base word:</span>
          <span class="base-value" style="color: #FFD700;">${challenge.base}</span>
        </p>
        <p class="level-info"><strong style="color: #FF5733;">(${displayLevel})</strong></p>
        <input type="text" id="review-answer-${index}" placeholder="Enter the correct form" autocomplete="off">
        <button id="review-submit-${index}">Submit Answer</button>
        <p id="review-feedback-${index}" style="margin:5px 0;"></p>
      </div>
    `;
  });
  
  // Render the review UI in a container that mimics the main game UI style.
  document.body.innerHTML = `
    <style>
      body {
        font-family: 'Poppins', sans-serif;
        background: linear-gradient(135deg, #2E3192, #1BFFFF);
        color: white;
        text-align: center;
        margin: 0;
        padding: 20px;
      }
      #review-container {
        max-width: 600px;
        margin: auto;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 10px;
      }
      input, button {
        padding: 10px;
        font-size: 16px;
        margin: 10px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
      }
      input[type="text"] {
        width: 80%;
      }
      .highlight {
        font-weight: bold;
        color: #FFD700;
      }
      .submitted-correct {
        background-color: #d4edda;
        color: #155724;
      }
      .submitted-incorrect {
        background-color: #f8d7da;
        color: #721c24;
      }
      .correct-feedback {
        font-weight: bold;
        color: green;
      }
      .incorrect-feedback {
        font-weight: bold;
        color: red;
      }
      /* Buttons for navigation */
      #backToMain, #downloadReport {
        background: linear-gradient(135deg, #32CD32, #228B22);
        color: #fff;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      #backToMain:hover, #downloadReport:hover {
        background: linear-gradient(135deg, #228B22, #32CD32);
        transform: translateY(-2px);
      }
      #backToMain:active, #downloadReport:active {
        transform: translateY(1px);
      }
      /* Style for review challenge submit buttons */
      .challenge button {
        background: linear-gradient(135deg, #80cbc4, #4db6ac);
        color: #000;
        transition: background 0.3s ease, transform 0.2s ease;
      }
      .challenge button:hover {
        background: linear-gradient(135deg, #4db6ac, #80cbc4);
        transform: translateY(-2px);
      }
      .challenge button:active {
        transform: translateY(1px);
      }
    </style>
    <div id="review-container">
      <h1>Review Mistakes</h1>
      ${reviewHTML}
      <button id="backToMain">Back</button>
      <button id="downloadReport">Download Report</button>
    </div>
  `;
  
  // Attach event listeners for each review challenge's submit button.
  mistakes.forEach((challenge, index) => {
    const submitBtn = document.getElementById(`review-submit-${index}`);
    const inputEl = document.getElementById(`review-answer-${index}`);
    
    submitBtn.addEventListener("click", () => this.checkReviewAnswer(challenge, index));
    inputEl.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.checkReviewAnswer(challenge, index);
      }
    });
  });
  
  // Attach listeners for navigation buttons.
  document.getElementById("backToMain").addEventListener("click", () => this.initGameUI());
  document.getElementById("downloadReport").addEventListener("click", () => this.downloadReport());
}

checkReviewAnswer(challenge, index) {
  const inputEl = document.getElementById(`review-answer-${index}`);
  if (inputEl.disabled) return;
  
  const userAnswer = inputEl.value;
  let acceptedAnswers = Array.isArray(challenge.answer)
    ? challenge.answer
    : challenge.answer.split('/').map(a => a.trim());
    
  const feedbackEl = document.getElementById(`review-feedback-${index}`);
  
  if (isAnswerCorrect(userAnswer, acceptedAnswers)) {
    feedbackEl.textContent = "Correct!";
    feedbackEl.classList.add("correct-feedback");
    inputEl.classList.add("submitted-correct");
  } else {
    feedbackEl.textContent = "Incorrect. Correct answer: " + acceptedAnswers.join(" / ");
    feedbackEl.classList.add("incorrect-feedback");
    inputEl.classList.add("submitted-incorrect");
  }
  // Disable the input and button for this review challenge.
  inputEl.disabled = true;
  document.getElementById(`review-submit-${index}`).disabled = true;
}

// <-- ADD THIS METHOD HERE INSIDE THE CLASS
shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
}

const wordFormationData = [
  {
    base: "FREEZE",
    gappedSentence: "The vegetables had been ______ to preserve their freshness.",
    answer: "frozen",
    tags: "B1, adjectives, irregular verbs, past participles, participles"
  },
  {
    base: "ALTERNATE",
    gappedSentence:
      "We need to find an ______ solution that doesn’t involve increasing costs.",
    answer: "alternative",
    tags: "B2, adjectives, suffix -ive"
  },
  {
    base: "WIDE",
    gappedSentence:
      "This technique is ______ used in scientific research around the world.",
    answer: "widely",
    tags: "B1, adverbs"
  },
  {
    base: "ADVERT",
    gappedSentence:
      "The product was heavily ______ on social media before its launch.",
    answer: ["advertised", "advertized"],
    tags: "B1, verbs, past participles, regular, verb forms, participles"
  },
  {
    base: "LOVE",
    gappedSentence:
      "Valentine’s Day is popular among ______ who want to celebrate their relationship.",
    answer: "lovers",
    tags: "B1, nouns, people, suffix -er"
  },
  {
    base: "DAY",
    gappedSentence: "The news is updated on a ______ basis.",
    answer: "daily",
    tags: "B2, adjectives, time expressions, suffix -ly"
  },
  {
    base: "CONSUME",
    gappedSentence:
      "Modern ______ are more concerned about sustainability than ever before.",
    answer: "consumers",
    tags: "B1, nouns, people, suffix -er"
  },
  {
    base: "CARE",
    gappedSentence: "He drove ______ because the roads were icy.",
    answer: "carefully",
    tags: "B1, adverbs, manner, suffix -ful, ful/less"
  },
  {
    base: "ALLOW",
    gappedSentence:
      "She receives a monthly ______ from her parents to help with living expenses.",
    answer: "allowance",
    tags: "B2, nouns, abstract nouns, suffix -ance"
  },
  {
    base: "HEALTH",
    gappedSentence: "Eating too much fast food can be ______.",
    answer: "unhealthy",
    tags: "B2, adjectives, prefixes, negative, suffix -y"
  },
  {
    base: "KNOW",
    gappedSentence:
      "The restaurant is ______ for its traditional recipes and friendly staff.",
    answer: ["well-known", "well known"], 
    // or "well known," depending on how you want to handle hyphenation
    tags: "B2, adjectives, compound adjectives, participles, past participles"
  },
  {
    base: "ROMANCE",
    gappedSentence: "They spent a ______ weekend in the countryside.",
    answer: "romantic",
    tags: "B1, adjectives, suffix -ic"
  },
  {
    base: "POPULATE",
    gappedSentence: "The ______ of the city has doubled in the last decade.",
    answer: "population",
    tags: "B1, nouns, suffix -ion"
  },
  {
    base: "STRATEGY",
    gappedSentence:
      "They made a ______ decision to expand into new markets.",
    answer: "strategic",
    tags: "B2, adjectives, suffix -ic"
  },
  {
    base: "SITE",
    gappedSentence: "The hotel is ______ in the heart of the old town.",
    answer: "situated",
    tags: "B2, past participles, adjectives, verbs, regular verbs"
  },
  {
    base: "LEAD",
    gappedSentence:
      "The summit was attended by political ______ from across the globe.",
    answer: "leaders",
    tags: "B1, nouns, people, plural, suffix -er"
  },
  {
    base: "FORMAL",
    gappedSentence: "He spoke ______ at the opening ceremony.",
    answer: "formally",
    tags: "B1, adverbs, regular, suffix -al"
  },
  {
    base: "EXPAND",
    gappedSentence:
      "The company announced an ______ into the Asian market.",
    answer: "expansion",
    tags: "B2, nouns, abstract nouns, singular, suffix -ion"
  },
  {
    base: "DEPEND",
    gappedSentence: "The country fought hard to gain its ______.",
    answer: "independence",
    tags: "B2, nouns, abstract nouns, prefixes, negative, singular, suffix -ence"
  },
  {
    base: "EVIDENCE",
    gappedSentence:
      "It was ______ that she had put a lot of effort into the project.",
    answer: "evident",
    tags: "B2, adjectives, suffix -ent"
  },
  {
    base: "TOUR",
    gappedSentence:
      "The region relies heavily on ______ for economic growth.",
    answer: "tourism",
    tags: "B1, nouns, abstract nouns, suffix -ism"
  },
  {
    base: "MONARCHY",
    gappedSentence:
      "The country’s government is a ______ system headed by a king.",
    answer: "monarchical",
    tags: "B2, adjectives, suffix -al"
  },
  {
    base: "NOMINATE",
    gappedSentence: "She received a formal ______ to attend the award ceremony.",
    answer: "nomination",
    tags: "B2, nouns, abstract nouns, suffix -ion"
  },
  {
    base: "RECEIVE",
    gappedSentence: "Please keep your ______ as proof of payment.",
    answer: "receipt",
    tags: "C1, nouns, irregular nouns, irregular"
  },
  {
    base: "DINE",
    gappedSentence: "The restaurant was filled with regular ______ enjoying their meals.",
    answer: "diners",
    tags: "B2, nouns, people, plural, suffix -er"
  },
  {
    base: "CHOOSE",
    gappedSentence: "The winner had been carefully ______ by a panel of experts.",
    answer: "chosen",
    tags: "B2, verbs, past participles, participles, irregular verbs, irregular"
  },
  {
    base: "CONTEST",
    gappedSentence: "The election result was fiercely ______ by the opposition.",
    answer: "contested",
    tags: "B2, verbs, past participles, participles"
  },
  {
    base: "DEAD",
    gappedSentence: "The ______ for submissions is the 30th of June.",
    answer: "deadline",
    tags: "C1, nouns, compound nouns"
  },
  {
    base: "ANNOUNCE",
    gappedSentence: "The visit was completely ______ and caught everyone by surprise.",
    answer: "unannounced",
    tags: "C1, adjectives, prefixes, negative, participles, past participles"
  },
  {
    base: "PRESTIGE",
    gappedSentence: "The chef prepared a meal of ______ quality.",
    answer: "prestigious",
    tags: "C1, adjectives, suffix -ous"
  },
  {
    base: "ANNOY",
    gappedSentence: "Her constant interruptions caused great ______.",
    answer: "annoyance",
    tags: "C1, nouns, abstract nouns, formal, suffix -ance"
  },
  {
    base: "BEAR",
    gappedSentence: "His behaviour was absolutely ______, and I had to leave the room.",
    answer: "unbearable",
    tags: "B2, adjectives, prefixes, negative, able/ible, suffix -able"
  },
  {
    base: "REFER",
    gappedSentence: "Please include a full list of ______ in your CV.",
    answer: "references",
    tags: "B2, nouns, abstract nouns, suffix -ence"
  },
  {
    base: "EMOTION",
    gappedSentence: "The film was incredibly ______ and brought many people to tears.",
    answer: "emotional",
    tags: "B2, adjectives, feelings, suffix -al"
  },
  {
    base: "HONEST",
    gappedSentence: "I admire her ______ in admitting the mistake so openly.",
    answer: "honesty",
    tags: "B2, nouns, abstract nouns, personality, suffix -y"
  },
  {
    base: "OFFEND",
    gappedSentence: "He made an offensive comment that caused great ______.",
    answer: "offence",
    tags: "B2, nouns, abstract nouns, suffix -ence"
  },
  {
    base: "CLOSE",
    gappedSentence: "The company refused to ______ the details of the agreement.",
    answer: "disclose",
    tags: "C1, verbs, prefixes, formal"
  },
  {
    base: "TRUE",
    gappedSentence: "I found her answer to be perfectly ______ and sincere.",
    answer: "truthful",
    tags: "B2, adjectives, ful/less, suffix -ful"
  },
  {
    base: "PHENOMENON",
    gappedSentence: "The performance was absolutely ______ and received a standing ovation.",
    answer: "phenomenal",
    tags: "C1, adjectives, suffix -al"
  },
  {
    base: "CENTRE",
    gappedSentence: "The capital is located in the ______ part of the country.",
    answer: "central",
    tags: "B2, adjectives, suffix -al"
  },
  {
    base: "LAST",
    gappedSentence: "His influence has had a ______ impact on the community.",
    answer: "lasting",
    tags: "B2, adjectives, participles, present participles"
  },
  {
    base: "SUIT",
    gappedSentence: "She was completely ______ to the demands of the role.",
    answer: "unsuited",
    tags: "C1, adjectives, prefixes, negative, past participles, participles"
  },
  {
    base: "CONTEMPORARY",
    gappedSentence: "Many of her ______ were also active in the art world.",
    answer: "contemporaries",
    tags: "C1, nouns, plural, people"
  },
  {
    base: "PRODUCE",
    gappedSentence: "The play was one of the most successful ______ of the year.",
    answer: "productions",
    tags: "B2, nouns, plural, suffix -ion"
  },
  {
    base: "ANSWER",
    gappedSentence: "The contract was signed but left completely ______ by the client.",
    answer: "unanswered",
    tags: "C1, adjectives, prefixes, negative, participles, past participles"
  },
  {
    base: "ORIGIN",
    gappedSentence: "Although popular today, the sport was ______ developed for military purposes.",
    answer: "originally",
    tags: "B2, adverbs, time expressions, suffix -al"
  },
  {
    base: "SEE",
    gappedSentence: "He lost his ______ after staring directly at the sun.",
    answer: "sight",
    tags: "B2, nouns, irregular, irregular nouns"
  },
  {
    base: "TRAIN",
    gappedSentence: "The athlete was completely ______ and needed guidance from the start.",
    answer: "untrained",
    tags: "C1, adjectives, prefixes, negative, past participles, participles"
  },
  {
    base: "WORK",
    gappedSentence: "My morning ______ includes cardio and stretching.",
    answer: "workout",
    tags: "C1, nouns, compound nouns, phrasal verbs"
  },
  {
    base: "NECESSARY",
    gappedSentence: "You’re not ______ required to complete the task by Friday, but it would help.",
    answer: "necessarily",
    tags: "B2, adverbs"
  },
  {
    base: "MAXIMUM",
    gappedSentence: "The new system was designed to ______ efficiency without increasing costs.",
    answer: ["maximise", "maximize"],
    tags: "C1, verbs, suffix -ise"
  },
  {
    base: "STRONG",
    gappedSentence: "The new regime focused on the ______ of the national economy.",
    answer: "strengthening",
    tags: "C1, nouns, gerunds, verbs, irregular, irregular, suffix -en"
  },
  {
    base: "ENTIRE",
    gappedSentence: "She kept the ______ of the novel in mind while writing the review.",
    answer: "entirety",
    tags: "C1, nouns, abstract nouns, formal, suffix -ty"
  },
  {
    base: "CLEAR",
    gappedSentence: "She explained her opinion very ______, leaving no room for doubt.",
    answer: "clearly",
    tags: "B2, adverbs, manner"
  },
  {
    base: "VITAL",
    gappedSentence: "After her illness, she returned to her usual energy and ______.",
    answer: "vitality",
    tags: "C1, nouns, abstract nouns, suffix -ity"
  },
  {
    base: "APPEAR",
    gappedSentence: "______ , he was unaware of the mistake he had made.",
    answer: "apparently",
    tags: "B2, adverbs, comment adverbs, suffix -ent"
  },
  {
    base: "STUBBORN",
    gappedSentence: "His ______ made it difficult for him to admit he was wrong.",
    answer: "stubbornness",
    tags: "C1, nouns, abstract nouns, personality, suffix -ness"
  },
  {
    base: "DEBATE",
    gappedSentence: "Whether the claim is true is still ______.",
    answer: "debatable",
    tags: "B2, adjectives, able/ible, suffix -able"
  },
  {
    base: "SURPRISE",
    gappedSentence: "It was a truly ______ outcome that no one had predicted.",
    answer: "surprising",
    tags: "B2, adjectives, participles, present participles"
  },
  {
    base: "FRESH",
    gappedSentence: "After the nap, she felt much more ______.",
    answer: "refreshed",
    tags: "C2, adjectives, participles, past participles, prefixes"
  },
  {
    base: "REST",
    gappedSentence: "I lay awake all night, completely ______.",
    answer: "restless",
    tags: "C1, adjectives, negative, personality, ful/less, suffix -less"
  },
  {
    base: "RESPOND",
    gappedSentence: "Despite all efforts, the customer remained completely ______.",
    answer: "unresponsive",
    tags: "C1, adjectives, prefixes, negative, suffix -ive"
  },
  {
    base: "CONTRIBUTE",
    gappedSentence: "Her ______ was key to the success of the entire project.",
    answer: "contribution",
    tags: "B2, nouns, suffix -ion"
  },
  {
    base: "FABRICATE",
    gappedSentence: "The documents turned out to be entirely ______.",
    answer: "fabricated",
    tags: "B2, adjectives, past participles, participles"
  },
  {
    base: "POPULAR",
    gappedSentence: "Social media has increased her online ______.",
    answer: "popularity",
    tags: "B2, nouns, abstract nouns, suffix -ity"
  },
  {
    base: "APPEAL",
    gappedSentence: "The colours she chose were dull and quite ______.",
    answer: "unappealing",
    tags: "C1, adjectives, negative, prefixes, participles, present participles"
  },
  {
    base: "DESIRE",
    gappedSentence: "The area has become a ______ location for families.",
    answer: "desirable",
    tags: "B2, adjectives, able/ible, suffix -able"
  },
  {
    base: "LEGAL",
    gappedSentence: "It’s ______ to drive without a valid licence.",
    answer: "illegal",
    tags: "B2, adjectives, negative, prefixes"
  },
  {
    base: "ETHIC",
    gappedSentence: "His actions were criticised as deeply ______ by the media.",
    answer: "unethical",
    tags: "C1, adjectives, negative, prefixes, suffix -al"
  },
  {
    base: "GRAND",
    gappedSentence: "The palace was restored to its former ______.",
    answer: "grandeur",
    tags: "C2, nouns, abstract nouns, formal, sufix -eur"
  },
  {
    base: "ERUPT",
    gappedSentence: "The sudden ______ of the volcano caught residents off guard.",
    answer: "eruption",
    tags: "B2, nouns, suffix -ion"
  },
  {
    base: "TOWER",
    gappedSentence: "Snow-capped peaks and ______ cliffs surrounded the valley.",
    answer: "towering",
    tags: "B2, adjectives, present participles, participles"
  },
  {
    base: "STRONG",
    gappedSentence: "She has shown incredible ______ throughout the crisis.",
    answer: "strength",
    tags: "B2, nouns, abstract nouns, irregular nouns, irregular"
  },
  {
    base: "SHELTER",
    gappedSentence: "The village was ______ by trees and mountains on all sides.",
    answer: "sheltered",
    tags: "B2, adjectives, past participles, participles"
  },
  {
    base: "ATMOSPHERE",
    gappedSentence: "The ______ music set the tone for the evening",
    answer: "atmospheric",
    tags: "C1, adjectives, suffix -ic"
  },
  {
    base: "PLEASE",
    gappedSentence: "The food had an ______ aftertaste that lingered for hours.",
    answer: "unpleasant",
    tags: "B2, adjectives, negative, prefixes, suffix -ant"
  },
  {
    base: "ESCAPE",
    gappedSentence: "Their situation was difficult, if not completely ______.",
    answer: "inescapable",
    tags: "C1, adjectives, negative, prefixes, able/ible, suffix -able"
  },
  {
    base: "DISPUTE",
    gappedSentence: "Her success is ______ proof of her talent and work ethic.",
    answer: "indisputable",
    tags: "C2, adjectives, negative, prefixes, able/ible, suffix -able"
  },
  {
    base: "RIGOUR",
    gappedSentence: "The training programme was known for its ______ standards.",
    answer: "rigorous",
    tags: "C1, adjectives, formal, suffix -ous"
  },
  {
    base: "DEDICATE",
    gappedSentence: "His lifelong ______ to the craft was evident in every movement.",
    answer: "dedication",
    tags: "B2, nouns, abstract nouns, suffix -ion"
  },
  {
    base: "ENDURE",
    gappedSentence: "The dancer’s ______ amazed the judges and audience alike.",
    answer: "endurance",
    tags: "B2, nouns, abstract nouns, suffix -ance"
  },
  {
    base: "MUSIC",
    gappedSentence: "Her ______ was obvious in the way she interpreted the rhythm.",
    answer: "musicality",
    tags: "C1, nouns, abstract nouns, suffix -ity"
  },
  {
    base: "SIMILAR",
    gappedSentence: "Their views turned out to be completely ______.",
    answer: "dissimilar",
    tags: "C1, adjectives, negative, prefixes"
  },
  {
    base: "EXPLODE",
    gappedSentence: "The fireworks had an impressive and ______ effect.",
    answer: "explosive",
    tags: "B2, adjectives, suffix -ive"
  },
  {
    base: "REPEAT",
    gappedSentence: "His speech style became too ______ and lacked originality.",
    answer: "repetitive",
    tags: "C1, adjectives, suffix -ive"
  },
  {
    base: "CONTROVERSY",
    gappedSentence: "The play received ______ reviews in the national press.",
    answer: "controversial",
    tags: "C1, adjectives, suffix -ial"
  },
  {
    base: "MORTAL",
    gappedSentence: "The author’s legacy was ______ by future generations.",
    answer: "immortalised",
    tags: "C2, verbs, prefixes, negative, past participles, participles"
  },
  {
    base: "DEBATE",
    gappedSentence: "Whether this policy will work remains ______.",
    answer: "debatable",
    tags: "B2, adjectives, able/ible, suffix -able"
  },
  {
    base: "DISPUTE",
    gappedSentence: "His brilliance as a performer makes him the ______ champion.",
    answer: "undisputed",
    tags: "C1, adjectives, negative, prefixes, participles, past participles"
  },
  {
    base: "REMAIN",
    gappedSentence: "Archaeologists discovered the ______ of a long-forgotten structure.",
    answer: "remains",
    tags: "B2, nouns, plural"
  },
  {
    base: "ANALYSE",
    gappedSentence: "The scientist’s report included a detailed ______ of the findings.",
    answer: "analysis",
    tags: "B2, nouns, abstract nouns, irregular nouns, irregular, suffix -is"
  },
  {
    base: "IDENTITY",
    gappedSentence: "The police are awaiting formal ______ of the suspect.",
    answer: "identification",
    tags: "B2, nouns, abstract nouns, formal, suffix -ion"
  },
  {
    base: "CONCLUDE",
    gappedSentence: "The evidence was strong enough to be considered ______.",
    answer: "conclusive",
    tags: "C1, adjectives, suffix -ive"
  },
  {
    base: "BEHAVE",
    gappedSentence: "The child’s ______ improved after taking part in group activities.",
    answer: ["behaviour", "behavior"],
    tags: "B2, nouns, abstract nouns, suffix -our"
  },
  {
    base: "SIGNIFY",
    gappedSentence: "The discovery of water on the planet was highly ______.",
    answer: "significant",
    tags: "B2, adjectives, suffix -ant"
  },
  {
    base: "RIDICULE",
    gappedSentence: "That idea is absolutely ______ — you can’t be serious!",
    answer: "ridiculous",
    tags: "B2, adjectives, suffix -ous"
  },
  {
    base: "NUMBER",
    gappedSentence: "She came up with ______ examples to support her point.",
    answer: "numerous",
    tags: "C1, adjectives, irregular, irregular adjectives, suffix -ous"
  },
  {
    base: "EFFECT",
    gappedSentence: "The new policy proved surprisingly ______.",
    answer: "effective",
    tags: "B2, adjectives, suffix -ive"
  },
  {
    base: "DEPRESS",
    gappedSentence: "The condition may lead to long-term ______ if untreated.",
    answer: "depression",
    tags: "B2, nouns, abstract nouns, suffix -ion"
  },
  {
    base: "RELATION",
    gappedSentence: "Their personal ______ had a big impact on the project.",
    answer: ["relationships", "relationship"],
    tags: "B2, nouns, plural, suffix -ship"
  },
  {
    base: "ABLE",
    gappedSentence: "This software ______ users to track their progress easily.",
    answer: "enables",
    tags: "C1, verbs, regular verbs, verb formation"
  },
  {
    base: "FAVOUR",
    gappedSentence: "The forecast suggests ______ weather conditions next week.",
    answer: ["unfavourable","unfavorable"], // or "unfavorable" as an alternative
    tags: "C1, adjectives, prefixes, negative, formal, suffix -able, able/ible"
  },
  {
    base: "PROBLEM",
    gappedSentence: "The current situation is deeply ______ and needs urgent attention.",
    answer: "problematic",
    tags: "C1, adjectives, suffix -ic"
  },
  {
    base: "INTENSE",
    gappedSentence: "The pressure of the situation only ______ the conflict.",
    answer: "intensifies",
    tags: "C1, verbs, verb forms, regular verbs, suffix -ify"
  },
  {
    base: "STABLE",
    gappedSentence: "Political ______ can lead to a breakdown in trust.",
    answer: "instability",
    tags: "C1, nouns, abstract nouns, negative, prefixes, suffix -ity"
  },
  {
    base: "EFFECT",
    gappedSentence: "The team improved its ______ by using new software.",
    answer: "efficiency",
    tags: "C1, nouns, abstract nouns, suffix -cy"
  },
  {
    base: "PERFORM",
    gappedSentence: "Her dancing showed both precision and strong ______.",
    answer: "performance",
    tags: "B2, nouns, abstract nouns, suffix -ance"
  },
  {
    base: "RESIST",
    gappedSentence: "These materials are highly ______ to water damage.",
    answer: "resistant",
    tags: "B2, adjectives, suffix -ant"
  },
  {
    base: "LESS",
    gappedSentence: "New measures were introduced to ______ the impact of tourism.",
    answer: "lessen",
    tags: "C1, verbs, irregular, verb formation, suffix -en"
  },
  {
    base: "HABIT",
    gappedSentence: "The island had been ______ by humans for thousands of years.",
    answer: "inhabited",
    tags: "C1, verbs, past participles, adjectives, participles"
  },
  {
    base: "HIGH",
    gappedSentence: "The bird suddenly dropped from a great ______.",
    answer: "height",
    tags: "B2, nouns, irregular, irregular nouns"
  },
  {
    base: "DESCEND",
    gappedSentence: "She claimed to be a direct ______ of the famous explorer.",
    answer: "descendant",
    tags: "C1, nouns, people, suffix -ant"
  },
  {
    base: "MOUNTAIN",
    gappedSentence: "The region is known for its ______ terrain and dramatic views.",
    answer: "mountainous",
    tags: "B2, adjectives, suffix -ous"
  },
  {
    base: "FIND",
    gappedSentence: "The scientist shared her most recent ______ at the conference.",
    answer: "findings",
    tags: "C1, nouns, plural, formal"
  },
  {
    base: "ORIGIN",
    gappedSentence: "The practice is believed to have ______ in ancient Persia.",
    answer: "originated",
    tags: "C1, verbs, regular verbs, verb formation"
  },
  {
    base: "ADAPT",
    gappedSentence: "Their costumes were clever ______ of desert animals.",
    answer: "adaptations",
    tags: "B2, nouns, plural, suffix -ion"
  },
  {
    base: "STORE",
    gappedSentence: "The warehouse was converted into a secure ______ facility.",
    answer: "storage",
    tags: "C1, nouns, suffix -age"
  },
  {
    base: "CONCEPT",
    gappedSentence: "The article revealed several common ______ about the disease.",
    answer: "misconceptions",
    tags: "C2, nouns, plural, negative, prefixes, suffix -ion"
  },
  {
    base: "COMPARE",
    gappedSentence: "A useful ______ was made between two different cases.",
    answer: "comparison",
    tags: "C1, nouns, abstract nouns, irregular nouns"
  },
  {
    base: "FATAL",
    gappedSentence: "There were three reported ______ from the plane crash.",
    answer: "fatalities",
    tags: "C1, nouns, plural, formal, suffix -ity"
  },
  {
    base: "SOLITUDE",
    gappedSentence: "She led a _____ existence, away from the public eye.",
    answer: "solitary",
    tags: "C1, adjectives, personality, suffix -ary"
  },
  {
    base: "OCCUR",
    gappedSentence: "There have been several ______ of this phenomenon in recent months.",
    answer: "occurrences",
    tags: "B2, nouns, plural, abstract nouns, suffix -ence, ence/ance"
  },
  {
    base: "PLEASE",
    gappedSentence: "The meal had an ______ taste that most people disliked.",
    answer: "unpleasant",
    tags: "C1, adjectives, negative, prefixes, suffix -ant"
  },
  {
    base: "ESTIMATE",
    gappedSentence: "The risk of damage was severely ______ by the team.",
    answer: "underestimated",
    tags: "C2, verbs, past participles, negative, prefixes, participles, adjectives"
  },
  {
    base: "CAUTION",
    gappedSentence: "Visitors must follow strict ______ to avoid accidents.",
    answer: "precautions",
    tags: "C1, nouns, plural, prefixes, suffix -ion"
  },
  {
    base: "ELOQUENCE",
    gappedSentence: "She spoke ______, impressing everyone with her fluency.",
    answer: "eloquently",
    tags: "C1, adverbs, formal, suffix -ent"
  },
  {
    base: "CONCEIVE",
    gappedSentence: "It's perfectly ______ that this kind of event could happen again.",
    answer: "conceivable",
    tags: "C1, adjectives, able/ible, suffix -able"
  },
  {
    base: "RESPECT",
    gappedSentence: "His remarks were offensive and showed complete ______.",
    answer: "disrespect",
    tags: "B2, nouns, abstract nouns, negative, prefixes"
  },
  {
    base: "INFLUENCE",
    gappedSentence: "The journalist became highly ______ in political affairs.",
    answer: "influential",
    tags: "C1, adjectives, cial/tial, suffix -ial"
  },
  {
    base: "CREDIT",
    gappedSentence: "The witness was later ______ for lying under oath.",
    answer: "discredited",
    tags: "C2, verbs, past participles, negative, prefixes, formal, participles, adjectives"
  },
  {
    base: "CORPORATE",
    gappedSentence: "The painting ______ various features of her signature styles",
    answer: "incorporated",
    tags: "C1, past participles, participles, prefixes"
  },
  {
    base: "MODIFY",
    gappedSentence: "The article was of such high quality that the editor left it completely _____.",
    answer: "unmodified",
    tags: "C1, adjectives, past participles, negative, prefixes, participles, verb forms"
  },
  {
    base: "PROOF",
    gappedSentence: "The lawyer was unable to ______ the allegations.",
    answer: "disprove",
    tags: "C1, verbs, negative, prefixes, formal, verb formation"
  },
  {
    base: "ENDURE",
    gappedSentence: "The athlete’s ______ helped her complete the race despite the pain.",
    answer: "endurance",
    tags: "B2, nouns, abstract nouns, suffix -ance"
  },
  {
    base: "DOUBT",
    gappedSentence: "He is ______ the most talented student in the class.",
    answer: ["undoubtedly", "doubtless"],
    tags: "C1, adverbs, negative, prefixes, suffix -less, ful/less"
  },
  {
    base: "TOLERATE",
    gappedSentence: "The manager is open and very ______ of different working styles.",
    answer: "tolerant",
    tags: "B2, adjectives, personality, suffix -ant"
  },
  {
    base: "MASS",
    gappedSentence: "The elephant is a ______ animal in both size and strength.",
    answer: "massive",
    tags: "B2, adjectives, suffix -ive"
  },
  {
    base: "USE",
    gappedSentence: "They questioned the ______ of the advice given.",
    answer: "usefulness",
    tags: "B2, nouns, abstract nouns, suffix -ful, suffix -ness, ful/less"
  },
  {
    base: "ACCESS",
    gappedSentence: "The website is not ______ to users outside the EU.",
    answer: "accessible",
    tags: "C1, adjectives, able/ible, suffix -ible"
  },
  {
    base: "ANXIOUS",
    gappedSentence: "Taking exams is one of many student ______.",
    answer: "anxieties",
    tags: "C1, nouns, plural, abstract nouns, suffix -iety"
  },
  {
    base: "HOPE",
    gappedSentence: "______ , the plan succeeded despite early doubts.",
    answer: "Hopefully",
    tags: "B2, adverbs, discourse markers, comment adverbs, suffix -ful, ful/less"
  },
  {
    base: "APPEAL",
    gappedSentence: "The colours she chose were dull and quite ______.",
    answer: "unappealing",
    tags: "C1, adjectives, negative, prefixes, participles"
  },
  {
    base: "EXHAUST",
    gappedSentence: "The report offers an ______ analysis of the issue, covering every possible angle.",
    answer: "exhaustive",
    tags: "C1, adjectives, suffix -ive, formal, suffix -ive"
  },
  {
    base: "DISCIPLINE",
    gappedSentence: "As a strict ______, she believed in enforcing rules to the letter.",
    answer: "disciplinarian",
    tags: "C2, nouns, people, suffix -ian"
  },
  {
    base: "COAST",
    gappedSentence: "The entire ______ was affected by rising sea levels.",
    answer: "coastline",
    tags: "C1, nouns, compound nouns"
  },
  {
    base: "COAST",
    gappedSentence: "The town's ______ location makes it vulnerable to flooding.",
    answer: "coastal",
    tags: "B2, adjectives, suffix -al"
  },
  {
    base: "DEPEND",
    gappedSentence: "He's one of the most ______ employees I've ever worked with.",
    answer: "dependable",
    tags: "C1, adjectives, suffix -able, personality, able/ible"
  },
  {
    base: "REGARD",
    gappedSentence: "The company showed a complete ______ for environmental regulations.",
    answer: "disregard",
    tags: "C1, nouns, negative, prefixes, abstract nouns"
  },
  {
    base: "FRAUD",
    gappedSentence: "The police arrested the suspected ______ after a long investigation.",
    answer: "fraudster",
    tags: "C2, nouns, people, suffix -ster"
  },
  {
    base: "FRAUD",
    gappedSentence: "The document turned out to be ______, leading to an internal inquiry.",
    answer: "fraudulent",
    tags: "C1, adjectives, formal, suffix -ent"
  },
  {
    base: "FRAUD",
    gappedSentence: "He was accused of acting ______ to obtain the contract.",
    answer: "fraudulently",
    tags: "C2, adverbs, formal, suffix -ent"
  },
  {
    base: "LIMIT",
    gappedSentence: "The film explores a world that is vast and seemingly ______.",
    answer: "limitless",
    tags: "C1, adjectives, ful/less, negative, suffix -less"
  },
  {
    base: "LODGE",
    gappedSentence: "The earthquake managed to ______ the boulder from the cliff edge.",
    answer: "dislodge",
    tags: "C1, verbs, prefixes, negative"
  },
  {
    base: "LODGE",
    gappedSentence: "Their new flatmate turned out to be a respectful and tidy ______.",
    answer: "lodger",
    tags: "C1, nouns, people, suffix -er"
  },
  {
    base: "LODGE",
    gappedSentence: "They found temporary ______ in a small village outside the city.",
    answer: "lodgings",
    tags: "C2, nouns, plural, gerunds"
  },
  {
    base: "FOLLOW",
    gappedSentence: "The interview was meant to be a simple ______, not a second job offer.",
    answer: ["follow-up", "followup"],
    tags: "C1, nouns, compound nouns, phrasal verbs"
  },
  {
    base: "CHARACTER",
    gappedSentence: "She spoke ______ bluntly, surprising even her closest friends.",
    answer: "uncharacteristically",
    tags: "C2, adverbs, prefixes, negative, suffix -ic, style/discourse markers"
  },
  {
    base: "CHARACTER",
    gappedSentence: "The film's dark tone was criticised as a weak ______ of the novel.",
    answer: ["characterization", "characterisation"],
    tags: "C1, nouns, abstract nouns, suffix -ion, verb formation, suffix -ise"
  },
  {
    base: "APPRECIATE",
    gappedSentence: "He gave a short but ______ speech thanking the volunteers.",
    answer: "appreciative",
    tags: "C1, adjectives, suffix -ive, feelings"
  },
  {
    base: "DIVERSE",
    gappedSentence: "The country is proud of its cultural ______.",
    answer: "diversity",
    tags: "B2, nouns, abstract nouns, suffix -ity"
  },
  {
    base: "EXPAND",
    gappedSentence: "From above, the desert appeared to stretch out in an endless ______.",
    answer: "expanse",
    tags: "C1, nouns, suffix -anse"
  },
  {
    base: "EXPAND",
    gappedSentence: "She gave an ______ description of her journey through the Andes.",
    answer: "expansive",
    tags: "C2, adjectives, suffix -ive"
  },
  {
    base: "NOTE",
    gappedSentence: "The documentary focused on the actor’s sudden rise to ______.",
    answer: "notoriety",
    tags: "C1, nouns, abstract nouns, suffix -iety"
  },
  {
    base: "NOTE",
    gappedSentence: "The town became ______ for its harsh prison conditions.",
    answer: "notorious",
    tags: "C1, adjectives, suffix -ous"
  },
  {
    base: "BREAK",
    gappedSentence: "The movers were instructed to report any ______ during transport.",
    answer: "breakages",
    tags: "C2, nouns, plural, suffix -age"
  },
  {
    base: "BREAK",
    gappedSentence: "After the peace agreement, dissenters formed a _______ group in protest.",
    answer: "breakaway",
    tags: "C2, adjectives, compound adjectives, phrasal verbs"
  },
  {
    base: "WORTH",
    gappedSentence: "The training course proved far more ______ than we had expected.",
    answer: "worthwhile",
    tags: "C1, adjectives, compound adjectives"
  },
  {
    base: "WORTH",
    gappedSentence: "Her donation was extremely generous and deeply ______.",
    answer: "worthy",
    tags: "C1, adjectives, suffix -y"
  },
  {
    base: "ASPIRE",
    gappedSentence: "The ad campaign targets young, ______ professionals.",
    answer: "aspiring",
    tags: "C1, adjectives, present participles, participles"
  },
  {
    base: "ASPIRE",
    gappedSentence: "The magazine promotes an ______ lifestyle of luxury and success.",
    answer: "aspirational",
    tags: "C2, adjectives, suffix -al"
  },
  {
    base: "FEAR",
    gappedSentence: "He gave a ______ glance at the dark alley before moving on.",
    answer: "fearful",
    tags: "C1, adjectives, suffix -ful, feelings, ful/less"
  },
  {
    base: "FEAR",
    gappedSentence: "The soldiers approached with ______ determination.",
    answer: "fearsome",
    tags: "C2, adjectives, suffix -some"
  },
  {
    base: "NOURISH",
    gappedSentence: "The villagers relied on wild fruit and roots for basic ______.",
    answer: "nourishment",
    tags: "C1, nouns, abstract nouns, suffix -ment"
  },
  {
    base: "NOURISH",
    gappedSentence: "The children were severely ______ and in urgent need of care.",
    answer: "malnourished",
    tags: "C2, adjectives, negative, prefixes, past participles, participles"
  },
  {
    base: "STIMULATE",
    gappedSentence: "The dog responded to the ______ of the ringing bell.",
    answer: "stimulus",
    tags: "C1, nouns, formal"
  },
  {
    base: "STIMULATE",
    gappedSentence: "Doctors warn that overuse of certain ______ can be harmful.",
    answer: "stimulants",
    tags: "C1, nouns, plural, suffix -ant"
  },
  {
    base: "STIMULATE",
    gappedSentence: "It was one of the most ______ lectures I’ve attended.",
    answer: "stimulating",
    tags: "B2, adjectives, present participles, participles"
  },
  {
    base: "DEFEAT",
    gappedSentence: "His constant negativity gave him a reputation as a ______.",
    answer: "defeatist",
    tags: "C2, nouns, people, personality, suffix -ist"
  },
  {
    base: "DEFEAT",
    gappedSentence: "There's a growing sense of ______ among the younger generation.",
    answer: "defeatism",
    tags: "C2, nouns, abstract nouns, suffix -ism"
  },
  {
    base: "GUARD",
    gappedSentence: "He spoke ______, unwilling to reveal too much.",
    answer: "guardedly",
    tags: "C2, adverbs, past participles, participles"
  },
  {
    base: "GUARD",
    gappedSentence: "The child’s legal ______ was present during the interview.",
    answer: "guardian",
    tags: "B2, nouns, people, suffix -ian"
  },
  {
    base: "WORK",
    gappedSentence: "That plan sounds good in theory, but it’s completely ______ in practice.",
    answer: "unworkable",
    tags: "C2, adjectives, negative, prefixes, suffix -able, able/ible"
  },
  {
    base: "WORK",
    gappedSentence: "The company is expanding its ______ to cover electric vehicles.",
    answer: "workforce",
    tags: "C2, nouns, compound nouns"
  },
  {
    base: "DISMISS",
    gappedSentence: "She gave a cold and ______ response to the proposal.",
    answer: "dismissive",
    tags: "C1, adjectives, suffix -ive"
  },
  {
    base: "DISMISS",
    gappedSentence: "He ______ brushed off the suggestion without explanation.",
    answer: "dismissively",
    tags: "C1, adverbs, suffix -ive"
  },
  {
    base: "DISMISS",
    gappedSentence: "The sudden ______ of the employee caught everyone off guard.",
    answer: "dismissal",
    tags: "C1, nouns, abstract nouns, suffix -al"
  },
  {
    base: "DEAL",
    gappedSentence: "The showroom was located next to the main car ______.",
    answer: "dealership",
    tags: "C2, nouns, compound nouns, suffix -ship"
  },
  {
    base: "DEAL",
    gappedSentence: "His secret ______ with offshore companies were eventually exposed.",
    answer: "dealings",
    tags: "C2, nouns, plural, gerunds"
  },
  {
    base: "NAME",
    gappedSentence: "She was named after her great-grandmother, her ______.",
    answer: "namesake",
    tags: "C2, nouns, people, suffix-sake"
  },
  {
    base: "NAME",
    gappedSentence: "The person at fault will remain ______ at this time.",
    answer: "nameless",
    tags: "C1, adjectives, negative, suffix -less, ful/less"
  },
  {
    base: "SPECULATE",
    gappedSentence: "The ______ panicked when the housing market crashed.",
    answer: ["speculator", "speculators"],
    tags: "C1, nouns, people, suffix -or"
  },
  {
    base: "PERSIST",
    gappedSentence: "Her tone remained calm and ______ despite repeated interruptions.",
    answer: "persistent",
    tags: "B2, adjectives, suffix -ent, personality"
  },
  {
    base: "BITTER",
    gappedSentence: "Years of unfair treatment had left him deeply ______.",
    answer: "embittered",
    tags: "C2, adjectives, prefixes, past participles, feelings"
  },
  {
    base: "DRAW",
    gappedSentence: "The plan had several serious ______ that needed addressing.",
    answer: "drawbacks",
    tags: "C1, nouns, plural, compound nouns, negative"
  },
  {
    base: "AUTONOMY",
    gappedSentence: "The new system allows employees to work in a more ______ way.",
    answer: "autonomous",
    tags: "C1, adjectives, suffix -ous, personality"
  },
  {
    base: "ATTEND",
    gappedSentence: "Regular ______ is compulsory if students want to pass the course.",
    answer: "attendance",
    tags: "B2, nouns, abstract nouns, suffix -ance"
  },
  {
    base: "SUFFICE",
    gappedSentence: "His arguments were not ______ developed in the essay.",
    answer: "sufficiently",
    tags: "C1, adverbs, suffix -ent, formal"
  },
  {
    base: "DREAD",
    gappedSentence: "The event was so badly organised it was almost ______ embarrassing.",
    answer: "dreadfully",
    tags: "C2, adverbs, intensifier, negative, suffix -ful"
  },
  {
    base: "PRESS",
    gappedSentence: "The government is facing a ______ need for reform.",
    answer: "pressing",
    tags: "C2, adjectives, present participles, formal, participles"
  },
  {
    base: "IMAGINE",
    gappedSentence: "She's always been so ______ in her story telling.",
    answer: "imaginative",
    tags: "B2, adjectives, suffix -ive"
  },
  {
    base: "EXPERT",
    gappedSentence: "She was hired for her technical skills and ______ in the field.",
    answer: "expertise",
    tags: "C1, nouns, abstract nouns, suffix -ise"
  },
  {
    base: "IMMERSE",
    gappedSentence: "Total language ______ is one of the best ways to learn quickly.",
    answer: "immersion",
    tags: "C1, nouns, suffix -ion"
  },
  {
    base: "VALUE",
    gappedSentence: "The guide's help was absolutely ______  when we got lost in the mountains.",
    answer: "invaluable",
    tags: "C2, adjectives, prefixes"
  },
  {
    base: "INTERVENE",
    gappedSentence: "The government's ______ helped prevent a major crisis.",
    answer: "intervention",
    tags: "B2, nouns, formal, suffix -ion"
  },
  {
    base: "ADD",
    gappedSentence: "There has been an ______ increase in the number of complaints.",
    answer: "additional",
    tags: "B2, adjectives, suffix -al, suffix -ion"
  },
  {
    base: "PROCEED",
    gappedSentence: "The correct ______ must be followed in all surgical operations.",
    answer: "procedure",
    tags: "B2, nouns, formal, suffix -ure"
  },
  {
    base: "NOTORIETY",
    gappedSentence: "The region is ______ difficult to access by road.",
    answer: "notoriously",
    tags: "C2, adverbs, suffix -ous, negative"
  },
  {
    base: "CERTAIN",
    gappedSentence: "The test results will help to ______ whether the drug is effective.",
    answer: "ascertain",
    tags: "C2, verbs, formal, verb formation, prefixes"
  },
  {
    base: "CONCLUSIVE",
    gappedSentence: "The evidence provided was ______ and failed to convince the jury.",
    answer: "inconclusive",
    tags: "C1, adjectives, negative, prefixes, suffix -ive"
  },
  {
    base: "RESEARCH",
    gappedSentence: "The study was carried out by a team of experienced ______.",
    answer: "researchers",
    tags: "B2, nouns, people, plural, suffix -er"
  },
  {
    base: "RAIN",
    gappedSentence: "The area experiences heavy ______ during the winter months.",
    answer: "rainfall",
    tags: "C1, nouns, compound nouns"
  },
  {
    base: "RELATE",
    gappedSentence: "His comments were completely ______ to the topic being discussed.",
    answer: "unrelated",
    tags: "B2, adjectives, negative, prefixes, past participles, participles"
  },
  {
    base: "HISTORY",
    gappedSentence: "The museum was full of artefacts studied by famous ______.",
    answer: "historians",
    tags: "B2, nouns, people, plural, suffix -ian"
  },
  {
    base: "PHILOSOPHY",
    gappedSentence: "The novel explores deep and ______ questions about life.",
    answer: "philosophical",
    tags: "B2, adjectives, suffix -al"
  },
  {
    base: "TAKE",
    gappedSentence: "The task was formidable but has been _____ successfully",
    answer: "undertaken",
    tags: "C2, verbs, past participles, prefixes, irregular verbs"
  },
  {
    base: "REVOLUTION",
    gappedSentence: "The changes brought about a ______ shift in society.",
    answer: "revolutionary",
    tags: "B2, adjectives, suffix -ary"
  },
  {
    base: "PLACE",
    gappedSentence: "The new product is seen as a suitable ______ for the old one.",
    answer: "replacement",
    tags: "B2, nouns, suffix -ment, prefixes"
  },
  {
    base: "INNOVATE",
    gappedSentence: "The company became famous for hiring talented young ______.",
    answer: "innovators",
    tags: "C1, nouns, people, plural, suffix -or"
  },
  {
    base: "FRUIT",
    gappedSentence: "The new farming methods proved surprisingly ______.",
    answer: "fruitful",
    tags: "C1, adjectives, suffix -ful, ful/less"
  },
  {
    base: "STRONG",
    gappedSentence: "The military's resources were gradually ______ over the years.",
    answer: "strengthened",
    tags: "C1, verbs, past participles, verb formation, suffix -en"
  },
  {
    base: "RELY",
    gappedSentence: "The new government policy reduced the country's economic ______ on oil.",
    answer: "reliance",
    tags: "C1, nouns, abstract nouns, suffix -ance"
  },
  {
    base: "PACK",
    gappedSentence: "All the items were packed together in a large ______.",
    answer: "package",
    tags: "B2, nouns, suffix -age"
  },
  {
    base: "ERODE",
    gappedSentence: "Coastal cliffs are particularly vulnerable to ______ over time.",
    answer: "erosion",
    tags: "B2, nouns, suffix -ion"
  },
  {
    base: "MOIST",
    gappedSentence: "The plants need a certain level of ______ to grow properly.",
    answer: "moisture",
    tags: "C1, nouns, suffix -ure"
  },
  {
    base: "DRY",
    gappedSentence: "Long periods without rain have caused severe ______ across the region.",
    answer: "droughts/drought",
    tags: "C2, nouns, plural, irregular nouns"
  },
  {
    base: "EXIST",
    gappedSentence: "The continued ______ of such species depends on conservation efforts.",
    answer: "existence",
    tags: "B2, nouns, suffix -ence"
  },
  {
    base: "EXCEPT",
    gappedSentence: "The team worked ______ hard to meet the deadline.",
    answer: "exceptionally",
    tags: "C1, adverbs, suffix -ion, suffix -al"
  },
  {
    base: "SUBSTANCE",
    gappedSentence: "The report provided ______ evidence of corruption.",
    answer: "substantial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "SENSE",
    gappedSentence: "The patient was found to be extremely ______ to light and noise.",
    answer: "sensitive",
    tags: "B2, adjectives, suffix -ive, feelings, personality"
  },
  {
    base: "SEARCH",
    gappedSentence: "The scientists carried out detailed ______ into the disease.",
    answer: "research",
    tags: "B2, nouns, uncountable, prefixes"
  },
  {
    base: "GATHER",
    gappedSentence: "The meeting was organised for information ______ before the report.",
    answer: "gathering",
    tags: "C1, nouns, gerunds"
  },
  {
    base: "FINANCE",
    gappedSentence: "The report highlighted several ______ risks to the global economy.",
    answer: "financial",
    tags: "B2, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "REFERENCE",
    gappedSentence: "The study was purely ______ and not intended for practical use.",
    answer: "referential",
    tags: "C2, adjectives, suffix -ial, cial/tial, formal"
  },
  {
    base: "BENEFIT",
    gappedSentence: "The new law will have a ______ impact on low-income families.",
    answer: "beneficial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "ESSENCE",
    gappedSentence: "It's ______ that children have access to healthy food.",
    answer: "essential",
    tags: "B2, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "SUBSTANCE",
    gappedSentence: "The scientists collected ______ evidence to support their theory.",
    answer: "substantial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "PART",
    gappedSentence: "He only has a ______ understanding of the situation.",
    answer: "partial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "CONFIDENT",
    gappedSentence: "The file contains strictly ______ information and must not be shared.",
    answer: "confidential",
    tags: "B2, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "PART",
    gappedSentence: "The judge is honest, and known for being completely ______ in all decisions.",
    answer: "impartial",
    tags: "C1, adjectives, suffix -ial, cial/tial, prefixes, negative"
  },
  {
    base: "TORRENT",
    gappedSentence: "The area suffered ______ rainfall throughout the month.",
    answer: "torrential",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "CONSEQUENCE",
    gappedSentence: "His protests were ________ and business went on as usual.",
    answer: "inconsequential",
    tags: "C2, adjectives, suffix -ial, cial/tial, negative, prefixes"
  },
  {
    base: "SPACE",
    gappedSentence: "The architecture of the city reflects its ______ organisation.",
    answer: "spatial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "PREJUDICE",
    gappedSentence: "His remarks were deeply offensive and clearly ______.",
    answer: "prejudicial",
    tags: "C2, adjectives, suffix -ial, cial/tial, negative, formal"
  },
  {
    base: "PROVINCE",
    gappedSentence: "The liberals have won by massive margins in most ______ elections.",
    answer: "provincial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "SACRIFICE",
    gappedSentence: "The ritual required the ______ killing of animals.",
    answer: "sacrificial",
    tags: "C1, adjectives, suffix -ial, cial/tial"
  },
  {
    base: "SATISFY",
    gappedSentence: "Customer ______ is a key part of running a successful business.",
    answer: "satisfaction",
    tags: "B1, nouns, suffix -tion"
  },
  {
    base: "SUCCESS",
    gappedSentence: "The project turned out to be highly ______ despite the challenges.",
    answer: "successful",
    tags: "B2, adjectives, suffix -ful, ful/less"
  },
  {
    base: "COVER",
    gappedSentence: "They were surprised to ______ a new species in the forest.",
    answer: "discover",
    tags: "B2, verbs, prefixes, negative"
  },
  {
    base: "SOLVE",
    gappedSentence: "They finally found a ______ to the long-standing problem.",
    answer: "solution",
    tags: "B1, nouns, abstract, suffix -ion"
  },
  {
    base: "IMPROVE",
    gappedSentence: "There has been a clear ______ in his attitude over the last year.",
    answer: "improvement",
    tags: "B2, nouns, suffix -ment"
  },
  {
    base: "SCIENCE",
    gappedSentence: "Some ______ argue that climate change is reversible.",
    answer: "scientists",
    tags: "B2, nouns, people, plural, suffix -ist"
  },
  {
    base: "PERFORM",
    gappedSentence: "Her ______ impressed the judges.",
    answer: "performance",
    tags: "B1, nouns, suffix -ance, ence/ance"
  },
  {
    base: "CERTAIN",
    gappedSentence: "Although he is usually confident, he felt quite ______ in that situation.",
    answer: "uncertain",
    tags: "B1, adjectives, negative, prefixes"
  },
  {
    base: "TRUE",
    gappedSentence: "The witness was admired for their honesty and ______.",
    answer: "truth",
    tags: "B2, nouns, suffix -th, irregular nouns"
  },
  {
    base: "RELATION",
    gappedSentence: "Their close ______ made them work very well as a team.",
    answer: "relationship",
    tags: "B2, nouns, abstract nouns, suffix -ship"
  },
  {
    base: "SUIT",
    gappedSentence: "The dress was completely ______ for the formal event, so she had to change.",
    answer: "unsuitable",
    tags: "B2, adjectives, negative, prefixes, suffix -able, able/ible"
  },
  {
    base: "ABSENT",
    gappedSentence: "His sudden ______ shocked everyone in the office.",
    answer: "absence",
    tags: "B2, nouns, abstract nouns, suffix -ence, ence/ance"
  },
  {
    base: "APPROPRIATE",
    gappedSentence: "It is highly ______ to arrive late for an interview.",
    answer: "inappropriate",
    tags: "B2, adjectives, negative, prefixes, suffix -ate"
  },
  {
    base: "FORTUNATE",
    gappedSentence: "______, nobody was injured in the accident.",
    answer: "Unfortunately",
    tags: "B2, adverbs, negative, prefixes, comment adverbs"
  },
  {
    base: "EASY",
    gappedSentence: "The task was completed quickly and ______.",
    answer: "easily",
    tags: "B2, adverbs, manner"
  },
  {
    base: "CREDIBLE",
    gappedSentence: "His story was so strange it seemed almost ______.",
    answer: "incredible",
    tags: "B1, adjectives, negative, prefixes"
  },
  {
    base: "DESCRIBE",
    gappedSentence: "Could you give a brief ______ of the suspect?",
    answer: "description",
    tags: "B1, nouns, suffix -ion"
  },
  {
    base: "IMPRESS",
    gappedSentence: "His first ______ of the city left a lasting memory.",
    answer: "impression",
    tags: "B1, nouns, abstract nouns, suffix -ion"
  },
  {
    base: "SURROUND",
    gappedSentence: "The ______ villages are popular weekend destinations.",
    answer: "surrounding",
    tags: "C1, adjectives, present participles, participles"
  },
  {
    base: "FAR",
    gappedSentence: "The museum is located even ______ from the station than I thought.",
    answer: "farther/further",
    tags: "B2, adjectives, comparatives and superlatives, irregular adjectives"
  },
  {
    base: "DIFFICULT",
    gappedSentence: "She had no ______ in passing the driving test.",
    answer: "difficulty",
    tags: "B1, nouns, abstract nouns, suffix -y"
  },
  {
    base: "BEGIN",
    gappedSentence: "The course is perfect for complete ______.",
    answer: "beginners",
    tags: "B2, nouns, people, plural, suffix -er"
  },
  {
    base: "DANGER",
    gappedSentence: "The journey was long and often ______.",
    answer: "dangerous",
    tags: "B1, adjectives, suffix -ous"
  },
  {
    base: "OBSERVE",
    gappedSentence: "She's incredibly ______ and notices every small detail.",
    answer: "observant",
    tags: "B2, adjectives, suffix -ant"
  },
  {
    base: "REFUTE",
    gappedSentence: "They had to accept his version once he provided ______ evidence.",
    answer: "irrefutable",
    tags: "C1, adjectives, negative, prefixes, suffix -able, formal, ible/able"
  },
  {
    base: "DECORATE",
    gappedSentence: "The room was filled with colourful ______.",
    answer: "decoration/decorations",
    tags: "B1, nouns, suffix -ion"
  },
  {
    base: "FOOL",
    gappedSentence: "It was a rather ______ decision to invest all his money in that scheme.",
    answer: "foolish",
    tags: "B2, adjectives, suffix -ish, personality"
  },
  {
    base: "NECESSARY",
    gappedSentence: "That isn’t ______ true — it depends on the situation.",
    answer: "necessarily",
    tags: "B2, adverbs"
  },
  {
    base: "FLASH",
    gappedSentence: "His clothes were far too bright and ______ for the occasion.",
    answer: "flashy",
    tags: "C1, adjectives, suffix -y"
  },
  {
    base: "APPRECIATE",
    gappedSentence: "She was extremely ______ of all the support she received.",
    answer: "appreciative",
    tags: "C1, adjectives, suffix -ive, feelings"
  },
  {
    base: "ADAPT",
    gappedSentence: "She's very ______ and easily adjusts to new environments.",
    answer: "adaptable",
    tags: "B2, adjectives, suffix -able, personality, ible/able"
  },
  {
    base: "DESCEND",
    gappedSentence: "It's universally accepted that humans are ______ of primates.",
    answer: "descendants",
    tags: "C1, nouns, people, plural, suffix -ant"
  },
  {
    base: "MOUNTAIN",
    gappedSentence: "Such a climb should only be undertaken by experienced ______.",
    answer: "mountaineers",
    tags: "C1, nouns, people, plural, suffix -eer"
  },
  {
    base: "ALTERNATE",
    gappedSentence: "______, you could just tell her the truth.",
    answer: "Alternatively",
    tags: "C1, adverbs, suffix -ive"
  },
  {
    base: "DANGER",
    gappedSentence: "You're not just taking a risk — you're ______ other people's lives.",
    answer: "endangering",
    tags: "C1, verbs, present participle, prefixes"
  },
  {
    base: "STAND",
    gappedSentence: "His performance in the use of English was absolutely _____.",
    answer: "outstanding",
    tags: "C2, adjectives, prefixes, present participles, phrasal verbs"
  },
  {
    base: "GO",
    gappedSentence: "The company has _____ extraordinary changes since the new CEO was hired.",
    answer: "undergone",
    tags: "C2, verbs, irregular verbs, prefixes"
  },
  {
    base: "PROGRESS",
    gappedSentence: "Waiting lists for such operations have become ____ longer.",
    answer: "progressively",
    tags: "C1, adverbs, suffix -ive"
  },
  {
    base: "PURSUE",
    gappedSentence: "It's incredible the sacrifices people make in ____ of fame and riches.",
    answer: "pursuit",
    tags: "C2, nouns, abstract nouns, irregular nouns"
  },
  {
    base: "CUSTOM",
    gappedSentence: "It's ____ in Spain to stuff a stupid number of grapes into your mouth on New Year's Eve.",
    answer: "customary",
    tags: "C2, adjectives, suffix -ary"
  },
  {
    base: "INTERRUPT",
    gappedSentence: "It was a beautiful night — the first time Matilda enjoyed a full night of ____ sleep.",
    answer: "uninterrupted",
    tags: "C1, adjectives, negative, prefixes, past participles"
  },
  {
    base: "SYMPTOM",
    gappedSentence: "These tendencies are _____ of serious addiction.",
    answer: "symptomatic",
    tags: "C2, adjectives, suffix -ic"
  },
  {
    base: "WISE",
    gappedSentence: "A long life does not necessarily result in greater ____.",
    answer: "wisdom",
    tags: "C1, nouns, abstract nouns, irregular nouns"
  },
  {
    base: "DETECT",
    gappedSentence: "The sound is almost _____ to the human ear.",
    answer: "undetectable/indetectable",
    tags: "C1, adjectives, negative, prefixes, suffix -able, ible/able"
  },
  {
    base: "ASSEMBLE",
    gappedSentence: "The following tools may be necessary in the _____ of the furniture.",
    answer: "assembly",
    tags: "C1, nouns, abstract nouns, suffix -y"
  },
  {
    base: "CARVE",
    gappedSentence: "Several ancient _____ were discovered in the caves.",
    answer: "carvings",
    tags: "C2, nouns, plural, gerunds"
  }
];
const game = new WordFormationGame(wordFormationData);
game.checkForSharedSet();

