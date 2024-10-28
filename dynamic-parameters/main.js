let viz;

function initializeViz() {
    console.log("Viz initialized.");
    initializeParameterListeners(); // Initialize listeners to control parameters
}

// Function to set Date Range Input parameter value
async function setDateRangeInput(value) {
    const params = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();
    const dateRangeInputParam = params.find(p => p.name === "Date Range Input");
    console.log("Setting Date Range Input to:", value);  // Debug log
    await dateRangeInputParam.changeValueAsync(value);
}

// Function to clear Date Range Input if PARAM Date Start or PARAM Date End is manually changed
async function clearDateRangeInputIfNeeded(startDateChanged, endDateChanged) {
    if (startDateChanged || endDateChanged) {
        console.log("Clearing Date Range Input due to manual change."); // Debug log
        await setDateRangeInput(""); // Clear Date Range Input
    }
}

// Function to dynamically update PARAM Date Start and PARAM Date End based on Date Range Input
async function updateDateRangeFromInput() {
    const params = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();
    const dateRangeInputParam = params.find(p => p.name === "Date Range Input");
    const dateRangeInput = dateRangeInputParam.getCurrentValue().value;
    
    console.log("Date Range Input received:", dateRangeInput); // Debug log

    let parsedValue, unit;
    const match = dateRangeInput.match(/(\d+)\s*(y|yr|year|m|month|d|day)s?/i);

    if (match) {
        parsedValue = parseInt(match[1]);
        unit = match[2].toLowerCase();
        const today = new Date();
        let startDate;

        // Calculate PARAM Date Start based on unit
        switch(unit) {
            case "y":
            case "yr":
            case "year":
                startDate = new Date(today.setFullYear(today.getFullYear() - parsedValue));
                break;
            case "m":
            case "month":
                startDate = new Date(today.setMonth(today.getMonth() - parsedValue));
                break;
            case "d":
            case "day":
                startDate = new Date(today.setDate(today.getDate() - parsedValue));
                break;
        }

        // Update PARAM Date Start and PARAM Date End parameters
        const startDateParam = params.find(p => p.name === "PARAM Date Start");
        const endDateParam = params.find(p => p.name === "PARAM Date End");

        console.log("Setting PARAM Date Start to:", startDate);  // Debug log
        console.log("Setting PARAM Date End to today's date:", new Date()); // Debug log

        await startDateParam.changeValueAsync(startDate);
        await endDateParam.changeValueAsync(new Date()); // PARAM Date End is set to today's date
    }
}

// Function to initialize listeners for parameter changes
async function initializeParameterListeners() {
    const params = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();

    params.forEach(param => {
        if (param.name === "Date Range Input") {
            param.addEventListener(tableau.TableauEventType.ParameterValueChange, updateDateRangeFromInput);
        }
        if (param.name === "PARAM Date Start" || param.name === "PARAM Date End") {
            param.addEventListener(tableau.TableauEventType.ParameterValueChange, () => clearDateRangeInputIfNeeded(param.name === "PARAM Date Start", param.name === "PARAM Date End"));
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    tableau.extensions.initializeAsync().then(initializeViz);
});
