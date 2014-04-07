// http://stackoverflow.com/questions/7128675/from-green-to-red-color-depend-on-percentage
var percentColors = [
    { pct: 0.0, color: { r: 0xff, g: 0x30, b: 0 } },
    { pct: 0.2, color: { r: 0xff, g: 0x00, b: 0x10 } },
  //  { pct: 0.5, color: { r: 0xff, g: 0x0, b: 0xff } },
    { pct: 1.0, color: { r: 0x00, g: 0x00, b: 0xff } } ];

var getColorForPercentage = function(pct) {
    for (var i = 0; i < percentColors.length; i++) {
        if (pct <= percentColors[i].pct) {
            var lower = percentColors[i - 1] || percentColors[i];
            var upper = percentColors[i];
            var range = upper.pct - lower.pct;
            var rangePct = (pct - lower.pct) / range;
            var pctLower = 1 - rangePct;
            var pctUpper = rangePct;
            var color = {
                r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
                g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
                b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
            };
            //return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
            return rgbToHex(color.r, color.g, color.b);
        }
    }
}


//http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
