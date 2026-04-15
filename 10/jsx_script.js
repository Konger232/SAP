
    const DEBUG = true;

    const maxRows = 6;
    const wordLength = 5;
    const API_dictionary = "https://api.dictionaryapi.dev/api/v2/entries/en/"
    const API_randomWord = "https://random-word-api.herokuapp.com/word?number=1&length=" + wordLength;
    // Fall back words selection if the random word API is down
    const words = ["BREAK", "CHEER", "PAUSE", "LEGAL"];

    //let answer = words[Math.floor(Math.random() * words.length)];
    let answer = "MOODY";
    // hardcoded guesses
    let fakedGuesses = ["MIGHT", "FLOOD", "STRAY"];

    // Consolidate to one single root
    let appRoot;

    // Global Vars
    let gameOver = false;
    let boardData = [];

    let currentX = fakedGuesses.length;
    let currentY = 0;
    let keyStatus = {}; // keyStatus['A'] = "incorrect"
    let message = "";

    window.onload = function() {

        appRoot = ReactDOM.createRoot(document.getElementById("main"));

        //Answer is now hardcoded : MOODY
        //getRandomWord();

        // Prepare the boardData and render the main App component
        initBoard();
        reloadApp();

        // update board and status based on the hard coded guesses
        for (let i=0; i<fakedGuesses.length; i++) {
            let guess = fakedGuesses[i];
            let statuses = evalGuess(guess);

            // update the status
            for (let j=0; j<wordLength; j++) {
                boardData[i][j].char = guess[j];
                boardData[i][j].status = statuses[j];
            }

            // color the keys
            updateKeyboard(guess, statuses);
        }
    } // end window.onload

    // COMPONENTS - MUST RETURN AN OBJECT

    // function Tile({status, char}) {
    //     return React.createElement(
    //         "div",
    //         {className:"tile " + status},
    //         char
    //     );
    // }

    function App() {
        return <div id="container">
            <Board boardData={boardData} />
            <Keyboard />
            <NoteMessage message={message}/>
            <ResetGame />
        </div>
    }

    // Helper function to render the main App (THE root)
    function reloadApp() {
        appRoot.render(<App />);
    }

    function Tile({status, char}) {
        return <div className={"tile " + status}>{char}</div>;
    }

    // function TileRow({tiles}) {
    //     return React.createElement(
    //         "div",
    //         {className: "rowStyle"},
    //         tiles.map((tileData, idx) =>
    //             React.createElement(
    //                 Tile,
    //                 {key: idx, status:tileData.status, char:tileData.char},
    //                 null
    //             )
    //         ) // end of map
    //     ); // end of row create
    // }

    function TileRow({tiles}) {
        return <div className="rowStyle">{
            tiles.map((tileData, idx) =>
                <Tile 
                    key={idx} 
                    status={tileData.status}
                    char={tileData.char}
                />
            )
        }</div>
    }

    // function Board ({boardData}) {
    //     return React.createElement(
    //                 "div",
    //                 {className: "board"},
    //                 boardData.map((rowData, i) =>
    //                     React.createElement(
    //                         TileRow,
    //                         {key: i, tiles:rowData}
    //                     ) // end of row create
    //                 ) 
    //             ); // end of return createElement outter div
    // }

    function Board({boardData}) {
        return <div className="board">{
            boardData.map((rowData, i) =>
                <TileRow 
                    key={i}
                    tiles={rowData}
                />
            )
        }</div>
    }

    // Prepare the board data 
    function initBoard() {
        // reset boardData
        boardData = [];
        for (let i=0; i<maxRows; i++) {
            let row = [];
            for (let j=0; j<wordLength; j++) {
                row.push({char: "", status: "empty"});
            }
            boardData.push(row);
        }
    }

    // function ButtonKey ({char, status}) {
    //     return React.createElement(
    //         "button",
    //         {className: "key " + status, onClick:()=> handleKeyClick(char)},
    //         char
    //     );
    // }

    function ButtonKey ({char, status}) {
        return (<button className={"key " + status} onClick={() => handleKeyClick(char)}>
            {char}
            </button>);
    }


    function Keyboard() {
        const keyboardLayout = [
            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
            ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "CLEAR"]
        ];

        // return the entire keyboard tree using React.createElement
        return React.createElement(
            "div",
            {className:"keyboard"},
            keyboardLayout.map((row, idx) => 
                React.createElement(
                    "div",
                    {className:"keyRowStyle", key:idx},
                    row.map(
                        (char, idx) => React.createElement(
                            ButtonKey,
                            {key: idx, char: char, status: keyStatus[char] || ""} // Append class names of the key, status or not
                        )
                    ) // end of create individual key button 
                )// end of create keyboard row
            )
        ); // end of keybaord outter div (root)
    }

    function NoteMessage({message}) {
        return (<p className="note">{message}</p>);
    } 

    function ResetGame() {
        return (
            <button className="resetBtn" onClick = {() => resetGame()}>Play Again</button>
        );
    }


    // Update each key to reflect its status 
    function updateKeyboard(guess, statuses) {
        if (DEBUG) {console.log("Update Keyboard : Status " + statuses)}
        
        // update keyStatus
        for (let j=0; j<wordLength; j++) {
            let char = guess[j];
            let status = statuses[j];

            if (keyStatus[char] === "correct") continue;
            if (keyStatus[char] === "present" && status === "incorrect") continue;

            keyStatus[char] = status;
        }

        // Re-render
        reloadApp();

    }

    function handleKeyClick(key) {
        
        if (key === "ENTER") {
            submitGuess();
        } else if (key === "CLEAR") {
            clearLetter();
        } else {
            typeLetter(key);
        }
    }

    function resetGame() {
        // Reset global variables
        currentX = 0;
        currentY = 0;
        gameOver = false;
        answer = words[Math.floor(Math.random() * words.length)]; // pick another word
        //clear the note
        message = "";

        // reset data
        initBoard();
        // Re-render
        reloadApp();
        getRandomWord();
    
    }

    /*
        API: https://api.dictionaryapi.dev/api/v2/entries/en/[WORLD]
    */
    async function submitGuess() {
        
        if (gameOver) 
            return;

        // clear note on every new submit
        message = "";

        // if enter is clicked with fewer than 5 letters typed
        if (currentY < wordLength) {
            message = "No enough letters!";
            reloadApp();
            return;
        }

        // Get the current guess word
        let guess = "";
        for (let j=0; j<wordLength; j++) {
            guess += boardData[currentX][j].char;
        }

        // Only update the status if it is a valid word
        // waits for the result
        let isValid = await checkDictionary(guess);
        if (DEBUG) console.log ("isValid = " + isValid);

        if (isValid) {
            let statuses = evalGuess(guess);

            // update keyboard style after each submit
            updateKeyboard(guess, statuses);
            
            // update data
            for (let j=0; j<wordLength; j++) {
                boardData[currentX][j].status = statuses[j];
            }
            
            // Re-render
            reloadApp();

            if (guess === answer) {
                message = "YOU WIN!";
                gameOver = true;
                reloadApp();
                return;
            }

            currentX++;
            currentY = 0; // Get ready to move to the first column of the next row 
            
            // Check if current row is the last row 
            if (currentX === maxRows) {
                alert("Game over! The word was " + answer);
                gameOver = true;
            }
        }
    }

    function evalGuess(guess) {

        // Split each letter
        let guessChars = guess.split("");
        let answerChars = answer.split("");

        // Assume all letters are incorrect initially
        let result = ["incorrect", "incorrect", "incorrect", "incorrect", "incorrect"];

        // Case 1: Perfect match (letter and index)
        for (let j=0; j<wordLength; j++) {
            if (guessChars[j] === answerChars[j]) {
                result[j] = "correct";
                // set it to null to check again in the next loop
                guessChars[j] = null;
                answerChars[j] = null;
            }
        }

        // Case 2: Correct letter but wrong index
        for (let j=0; j<wordLength; j++) {

            if (guessChars[j] !== null) {
                // search for letter in the answer word
                if (answerChars.indexOf(guessChars[j]) !== -1) {
                    result[j] = "present";
                    answerChars[answerChars.indexOf(guessChars[j])] = null;
                    guessChars[j] = null;
                }
            }
                
        }

        if (DEBUG) console.log ("results : " + result);
        return result;

    } 

    function clearLetter() {
        if (currentY > 0) {
            currentY--; // move to the one behind
            boardData[currentX][currentY].char = ""; // clear the current tile
            // Re-render
            reloadApp();
        }
        
    } 
    
    function typeLetter(key) {
        if (DEBUG) console.log("you have typed " + key);
        if (DEBUG) console.log("currentX = " + currentX + " currentY = " + currentY);

        if (currentX < maxRows && currentY < wordLength) {
            boardData[currentX][currentY].char = key;
            currentY++; // move to the next column
            // Re-render
            reloadApp();
            
        }
    }

    /* API to check if the word is a valid word */
    function checkDictionary(word) {
        
        return fetch(API_dictionary + word.toLowerCase())
            // check for valid word returns 200 status; return 400 for invalid words
            .then(res => {

                if (res.status === 200) {
                    return res.json();
                } else {
                    message = word + " is not a valid word";
                    reloadApp();
                    return false;
                }
                
            })
            .then (data => {
                if (data === false ) return false;
                if (DEBUG) console.log("checkDictionary JSON API: ", data)
                
                message = word + " " + 
                            + data[0].meanings[0].partOfSpeech 
                            + data[0].meanings[0].definitions[0].definition;
                
                reloadApp();
                return true;
            })
            .catch(error => {
                
                message = word + " is not a valid word.";
                reloadApp();
                return false;
            }); // end of catch

    }

    /* Call Random Word API to randomly select a 5-letter word. 
    However, the Random word API keeps going down. */
    async function getRandomWord() {
       
        return fetch(API_randomWord)
        .then (res => {
            if (!res.ok)
                throw new Error ("API Down");
            return res.json();
        })
        .then(data => {
            if (DEBUG) console.log("getrandomWorld JSON :" + data);
            answer = data[0].toUpperCase();
        })
        .catch(error => {
            console.log("Random Wod API Down, using fall back")
            return words[Math.floor(Math.random() * words.length)];
        })
    }

