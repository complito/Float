if (process.argv[2] == '-h') {
    console.log('\nExample of running a script: node FILE_NAME INPUT_NUMBER -encode/-decode\n\n' +
    'Warning!!! Hexadecimal letters in the input number must be in upper case\n');
    process.exit(0);
}

var wholePart = '';
function Dec2BinWholePart(localWholePart) {
    if (localWholePart == 0) {
        wholePart = '0';
        return;
    }
    else if (localWholePart == 1) {
        wholePart = '1';
        return;
    }
    let remainderOfDivisionBy2 = localWholePart % 2;
    let integerDividedBy2 = parseInt(localWholePart / 2);
    if (integerDividedBy2 != 1) Dec2BinWholePart(integerDividedBy2);
    if (integerDividedBy2 == 1) wholePart = wholePart + integerDividedBy2 + remainderOfDivisionBy2;
    else wholePart += remainderOfDivisionBy2;
}

var fractionalPart = '';
function Dec2BinFractionalPart(localFractionalPart) {
    if (fractionalPart.length == 23) return;
    let doubledLocalFractionalPart = localFractionalPart * 2;
    if (doubledLocalFractionalPart != 1) {
        let parts = doubledLocalFractionalPart.toString().split('.');
        fractionalPart += parts[0];
        Dec2BinFractionalPart(parts[1] / Math.pow(10, parts[1].length));
    }
    else fractionalPart += doubledLocalFractionalPart;
}

let lettersDictionary = {
    'A': '1010',
    'B': '1011',
    'C': '1100',
    'D': '1101',
    'E': '1110',
    'F': '1111'
}
function Hex2Bin(hex) {
    let result = '';
    for (let i = 0; i < hex.length; ++i)
        if (hex[i] in lettersDictionary) result += lettersDictionary[hex[i]];
        else {
            Dec2BinWholePart(parseInt(hex[i]));
            let bin = wholePart;
            wholePart = '';
            while (bin.length < 4) bin = '0' + bin;
            result += bin;
        }
    return result;
}

let equivalentValuesToNumbers = {
    10: 'A',
    11: 'B',
    12: 'C',
    13: 'D',
    14: 'E',
    15: 'F'
}
let borderlineСases = [NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '-0', '0'];
let borderlineEquivalents = ['7FC00000', '7F800000', 'FF800000', '80000000', '00000000'];

if (process.argv[3] == '-encode') {
    String.prototype.hexEncode = function() {
        let result = '';
        for (let i = 0; i < this.length; i += 4) {
            let hex = parseInt(this.substr(i, 4), 2);
            if (hex > 9) hex = equivalentValuesToNumbers[hex];
            result += hex;
        }
        return result;
    }

    let input = process.argv[2];

    let index = borderlineСases.indexOf(input);
    if (index != -1) {
        console.log(borderlineEquivalents[index]);
        process.exit(0);
    }
        
    let result = '';
    if (input[0] == '-') {
        result += '1';
        input = input.replace('-', '');
    }
    else result += '0';

    let inputParts = input.split('.');
    if (inputParts.length > 2) {
        console.log('Incorrect number!');
        process.exit(1);
    }
    Dec2BinWholePart(parseInt(inputParts[0]));
    if (inputParts.length > 1) {
        Dec2BinFractionalPart('0.' + inputParts[1]);
        inputParts = wholePart + '.' + fractionalPart;
    }
    else inputParts = wholePart;
    let i = 0;
    while (inputParts[i] != 1) ++i;
    let bias;
    if (inputParts[0] != 0)
        bias = inputParts.indexOf('.') - i - 1;
    else bias = inputParts.indexOf('.') - i;
    let pointLocation;
    pointLocation = inputParts.indexOf('.') - bias;
    if (bias != 0) {
        inputParts = inputParts.substr(pointLocation - 1);
        let bits = [];
        let j = 0;
        for (let i = 0; i < inputParts.length; ++i) {
            if (i == inputParts.indexOf('.')) continue;
            if (j == 1) {
                bits[j] = '.';
                ++j;
                --i;
                continue;
            }
            bits[j] = inputParts[i];
            ++j;
        }
        inputParts = bits.join('');
    }
    let mantissa;
    if (inputParts.toString().split('.').length > 1)
        mantissa = inputParts.toString().split('.')[1];
    else mantissa = '00000000000000000000000';
    while (mantissa.length < 23)
        mantissa += '0';
    wholePart = '';
    Dec2BinWholePart(bias + 127);
    bias = wholePart;
    while (bias.length < 8)
        bias = '0' + bias;
    result = result + bias + mantissa;
    result = result.hexEncode();
    console.log(result);
}
else if (process.argv[3] == '-decode') {
    let input = process.argv[2];

    let index = borderlineEquivalents.indexOf(input);
    if (index != -1) {
        console.log(borderlineСases[index]);
        process.exit(0);
    }

    let result = '';
    let bin = Hex2Bin(input);

    if (bin[0] == '1') result += '-';
    let order = parseInt(bin.substr(1, 8), 2) - 127;
    let mantissa = bin.substr(9);
    let tempMantissa = [];

    if (order != 0) {
        if (order > 0) {
            tempMantissa[0] = '1';
            let j = 1;
            for (let i = 0; i < mantissa.length; ++i) {
                if (j == order + 1) {
                    tempMantissa[j] = '.';
                    ++j;
                    --i;
                    continue;
                }
                tempMantissa[j] = mantissa[i];
                ++j;
            }
        }
        else {
            let i = 0;
            for (; i < order + 1; ++i) {
                if (i == 1) {
                    tempMantissa[i] = '.';
                    continue;
                }
                tempMantissa[i] = '0';
            }
            tempMantissa[i++] = '1';
            for (let j = 0; j < mantissa.length; ++j) {
                tempMantissa[i] = mantissa[j];
                ++i;
            }
        }
        tempMantissa = tempMantissa.join('');
    }
    else tempMantissa = '1.' + mantissa;

    let startOfRepeatingZeros;
    for (let i = tempMantissa.length - 1; i > -1; --i) {
        if (tempMantissa[i] != '0') break;
        startOfRepeatingZeros = i;
    }
    tempMantissa = tempMantissa.substr(0, startOfRepeatingZeros);

    let tempMantissaInDec = 0;
    for (let i = 0; i < tempMantissa.length; ++i) {
        if (i < tempMantissa.indexOf('.'))
            tempMantissaInDec =
            tempMantissaInDec + tempMantissa[i] * Math.pow(2, tempMantissa.indexOf('.') - i - 1);
        else if (i == tempMantissa.indexOf('.')) continue;
        else
            tempMantissaInDec =
            tempMantissaInDec + tempMantissa[i] * Math.pow(2, tempMantissa.indexOf('.') - i);
    }
    result += tempMantissaInDec;
    console.log(result);
}