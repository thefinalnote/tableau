let viz;

function initializeViz() {
    console.log("Viz is initialized in Tableau Desktop context.");
    initializeParameterListeners(); // Initialize listeners to control parameters
}

// Function to set Date Range Input parameter value
async function setDateRangeInput(value) {
    const params = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();
    const dateRangeInputParam = params.find(p => p.name === "Date Range Input");
    await dateRangeInputParam.changeValueAsync(value);
}

// Function to clear Date Range Input if Dynamic Start or End Date is manually changed
async function clearDateRangeInputIfNeeded(startDateChanged, endDateChanged) {
    if (startDateChanged || endDateChanged) {
        await setDateRangeInput(""); // Clear Date Range Input
    }
}

// Function to dynamically update Dynamic Start Date and Dynamic End Date based on Date Range Input
async function updateDateRangeFromInput() {
    const params = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();
    const dateRangeInputParam = params.find(p => p.name === "Date Range Input");
    const dateRangeInput = dateRangeInputParam.getCurrentValue().value;
    
    let parsedValue, unit;
    const match = dateRangeInput.match(/(\d+)\s*(y|yr|year|m|month|d|day)s?/i);

    if (match) {
        parsedValue = parseInt(match[1]);
        unit = match[2].toLowerCase();
        const today = new Date();
        let startDate;

        // Calculate Dynamic Start Date based on unit
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

        // Update Dynamic Start Date and Dynamic End Date parameters
        const startDateParam = params.find(p => p.name === "Dynamic Start Date");
        const endDateParam = params.find(p => p.name === "Dynamic End Date");

        await startDateParam.changeValueAsync(startDate);
        await endDateParam.changeValueAsync(new Date()); // Dynamic End Date is set to today's date
    }
}

// Function to initialize listeners for parameter changes
async function initializeParameterListeners() {
    const params = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();

    params.forEach(param => {
        if (param.name === "Date Range Input") {
            param.addEventListener(tableau.TableauEventType.ParameterValueChange, updateDateRangeFromInput);
        }
        if (param.name === "Dynamic Start Date" || param.name === "Dynamic End Date") {
            param.addEventListener(tableau.TableauEventType.ParameterValueChange, () => clearDateRangeInputIfNeeded(param.name === "Dynamic Start Date", param.name === "Dynamic End Date"));
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    tableau.extensions.initializeAsync().then(initializeViz);
});
