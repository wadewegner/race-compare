function convertTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
    } else if (parts.length === 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    }
    return 0;
}

module.exports = {
    convertTimeToMinutes
}; 