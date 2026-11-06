
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

//The word must be letters only,words with hyphens, apostrophes, or spaces are allowed.Not numbers/numerics  or other symbols 
const VALID_WORD = /^[a-zA-Z]+(?:[-' ][a-zA-Z]+)*$/;

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const searchBtn = form.querySelector("button[type='submit']");
const message = document.getElementById("message");
const result = document.getElementById("result");
const wordEl = document.getElementById("word");
const phoneticEl = document.getElementById("phonetic");
const audioEl = document.getElementById("audio");
const meaningsEl = document.getElementById("meanings");
const sourceLink = document.getElementById("source-link");
const saveBtn = document.getElementById("save-btn");
const savedList = document.getElementById("saved-list");
const emptySaved = document.getElementById("empty-saved");
const themeToggle = document.getElementById("theme-toggle");

let currentWord = "";
let latestRequest = 0;
let savedWords = loadSavedWords();



function loadSavedWords() {
  try {
    const stored = JSON.parse(localStorage.getItem("savedWords"));
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function storeSavedWords() {
  try {
    localStorage.setItem("savedWords", JSON.stringify(savedWords));
  } catch (error) {

  }
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}


function clearResult() {
  result.hidden = true;
  currentWord = "";
  showSavedWords();
}

// make an element with optional class and text content
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

//search for a word when the form is submitted 

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const word = input.value.trim();

  if (word === "") {
    showMessage("Please type a word to search.");
    clearResult();
    return;
  }

  if (!VALID_WORD.test(word)) {
    showMessage("Please use letters only (no numbers or symbols).");
    clearResult();
    return;
  }

  fetchWordData(word);
});

// get the word from the API 
function fetchWordData(word) {
  const requestId = ++latestRequest;

  showMessage("Searching...");
  result.hidden = true;
  searchBtn.disabled = true;

  fetch(API_URL + encodeURIComponent(word))
    .then((response) => {
      if (response.status === 404) {
        throw new Error("not found");
      }
      if (!response.ok) {
        throw new Error("server");
      }
      return response.json();
    })
    .then((data) => {
      if (requestId !== latestRequest) return;
      message.hidden = true;
      updateDOM(data[0]);
    })
    .catch((error) => {
      if (requestId !== latestRequest) return;

      if (error.message === "not found") {
        showMessage(`Sorry, we could not find "${word}". Check the spelling and try again.`);
      } else if (error.message === "server") {
        showMessage("The dictionary service had a problem. Please try again later.");
      } else {
        showMessage("Something went wrong. Check your internet connection and try again.");
      }
      clearResult();
    })
    .finally(() => {
      if (requestId === latestRequest) {
        searchBtn.disabled = false;
      }
    });
}

//show the output in the DOM

function updateDOM(entry) {
  currentWord = entry.word.toLowerCase();
  wordEl.textContent = entry.word;

  //  use the main one found in the phonetics list, or the first one found in the phonetics list
  const phonetics = entry.phonetics || [];
  const withText = phonetics.find((p) => p.text);
  phoneticEl.textContent = entry.phonetic || (withText ? withText.text : "");



  // meanings
  meaningsEl.innerHTML = "";
  entry.meanings.forEach((meaning) => {
    const block = createEl("div", "meaning");
    block.appendChild(createEl("h3", "", meaning.partOfSpeech));

    const list = document.createElement("ol");
    meaning.definitions.forEach((item) => {
      const li = createEl("li", "", item.definition);
      if (item.example) {
        li.appendChild(createEl("span", "example", `"${item.example}"`));
      }
      list.appendChild(li);
    });
    block.appendChild(list);

    const synonyms = meaning.synonyms || [];
    if (synonyms.length > 0) {
      block.appendChild(
        createEl("p", "synonyms", "Synonyms: " + synonyms.slice(0, 6).join(", "))
      );
    }

    meaningsEl.appendChild(block);
  });

  // source link
  if (entry.sourceUrls && entry.sourceUrls.length > 0) {
    sourceLink.textContent = entry.sourceUrls[0];
    sourceLink.href = entry.sourceUrls[0];
  } else {
    sourceLink.textContent = "not available";
    sourceLink.removeAttribute("href");
  }

  result.hidden = false;
  checkSaved();
  showSavedWords();
}

// change the save button if the current word is already saved 
function checkSaved() {
  if (savedWords.includes(currentWord)) {
    saveBtn.textContent = "Saved";
    saveBtn.classList.add("saved");
  } else {
    saveBtn.textContent = "Save word";
    saveBtn.classList.remove("saved");
  }
}

// save or unsave the current word
saveBtn.addEventListener("click", function () {
  if (currentWord === "") return;

  if (savedWords.includes(currentWord)) {
    savedWords = savedWords.filter((w) => w !== currentWord);
  } else {
    savedWords.push(currentWord);
  }
  storeSavedWords();
  checkSaved();
  showSavedWords();
});

// LIST OF SAVED WORDS
function showSavedWords() {
  savedList.innerHTML = "";
  emptySaved.hidden = savedWords.length > 0;

  savedWords.forEach((word) => {
    const li = document.createElement("li");

    if (word === currentWord) {
      li.classList.add("current");
    }

    const wordBtn = createEl("button", "word-link", word);
    wordBtn.type = "button";
    wordBtn.addEventListener("click", function () {
      input.value = word;
      fetchWordData(word);
    });

    const removeBtn = createEl("button", "remove", "x");
    removeBtn.type = "button";
    removeBtn.setAttribute("aria-label", `Remove ${word}`);
    removeBtn.addEventListener("click", function () {
      savedWords = savedWords.filter((w) => w !== word);
      storeSavedWords();
      checkSaved();
      showSavedWords();
    });

    li.appendChild(wordBtn);
    li.appendChild(removeBtn);
    savedList.appendChild(li);
  });
}

//BLlack and white theme 

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch (error) {
  
  }
});


try {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  }
} catch (error) {

}
showSavedWords();
