const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let inHomeFunction = false;
let homeFunctionStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Track when we enter the Home function
  if (line.includes('function Home()')) {
    inHomeFunction = true;
    homeFunctionStart = lineNum;
    console.log(`HOME FUNCTION STARTS: Line ${lineNum}`);
  }
  
  if (inHomeFunction) {
    // Count braces in this line
    const openCount = (line.match(/{/g) || []).length;
    const closeCount = (line.match(/}/g) || []).length;
    
    openBraces += openCount - closeCount;
    
    // If we reach 0 braces and we're past the function start, Home function has ended
    if (openBraces <= 0 && lineNum > homeFunctionStart + 10) {
      console.log(`HOME FUNCTION POTENTIALLY ENDS: Line ${lineNum} - Brace count: ${openBraces}`);
      console.log(`Line content: '${line.trim()}'`);
      
      // Check if this is before the main return statement
      if (lineNum < 1875) {
        console.log(`*** FOUND PROBLEM: Home function closes at line ${lineNum}, but main return is at line 1875 ***`);
        // Show context around this line
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+3); j++) {
          const marker = j === i ? ' >>> ' : '     ';
          console.log(`${marker}${j+1}: ${lines[j]}`);
        }
        break;
      }
    }
    
    // Show some intermediate status
    if (lineNum % 500 === 0) {
      console.log(`Line ${lineNum}: Brace balance = ${openBraces}`);
    }
  }
}