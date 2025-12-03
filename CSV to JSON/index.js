import { log } from 'console'
import { transformFactory } from './transformer.js'
import fs from 'fs'
import path from 'path'
import readline from 'readline'


let transformFunction = transformFactory('EPSG:26191', 'EPSG:4326')

const inputFilePath = path.join('.', 'points - all.csv')

const rl = readline.createInterface({
    input: fs.createReadStream(inputFilePath),
    output: process.stdout,
    terminal: false
})

let lineNumber = 0
const points_transformed = []

rl.on('line', (line) => {
    lineNumber++
    if (lineNumber === 1) {
        // Assuming the first line is the header
        return
    }

    let [, , xStr, yStr, angleStr, value] = line.split(',')
    const x = parseFloat(xStr)
    const y = parseFloat(yStr)
    const angle = parseFloat(angleStr)

    if (isNaN(x) || isNaN(y) || isNaN(angle)) {
        console.log(`Invalid data at line ${lineNumber}: ${line}`)
        return
    }
    const [lon, lat] = transformFunction.forward([x, y])
    // transform grad to degrees
    let angleInDegrees = angle * (9 / 10); 
    points_transformed.push({ lineNumber, lon, lat, angleInDegrees, value })    
})

// save the transformed points to a new json file
rl.on('close', () => {
    const outputFilePath = path.join('.', 'annotations.json')
    fs.writeFileSync(outputFilePath, JSON.stringify(points_transformed, null, 2))
    console.log(`Transformed points saved to ${outputFilePath}`)
})
