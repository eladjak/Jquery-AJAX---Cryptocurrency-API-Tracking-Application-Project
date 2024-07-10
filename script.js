// script.js
// Cache to store coin data
let coinCache = {};

// Selected coins for live report
let selectedCoins = [];

// Chart instances
let liveChart, bitcoinChart;

// Flag to check if app has been initialized
let appInitialized = false;

// Main function to initialize the app
function initApp() {
    console.log("Initializing app...");
    loadSelectedCoins();
    loadHomePage();
    setupNavigation();
    setupSearch();
    handleParallax();
    addShineAnimation();
    setupInfiniteScroll();
    setupBackgroundFallback();
    appInitialized = true;
    console.log("App initialized.");
}

// Call initApp when document is ready
$(document).ready(function() {
    console.log("Document ready.");
    initApp();
});

// Fallback in case jQuery's ready event doesn't fire
window.addEventListener('load', function() {
    console.log("Window loaded.");
    if (!appInitialized) {
        initApp();
    }
});

// Function to setup background fallback
function setupBackgroundFallback() {
    const video = document.getElementById('bgVideo');
    video.addEventListener('error', function(e) {
        console.log('Video error. Falling back to image.');
        document.getElementById('bgContainer').style.backgroundImage = "url('images/crypto-background.jpg')";
        document.getElementById('bgContainer').style.backgroundSize = "cover";
        video.style.display = 'none';
    });
}

// Function to toggle search visibility
function toggleSearchVisibility(show) {
    if (show) {
        $('.search-container').show();
    } else {
        $('.search-container').hide();
    }
}

// Function to setup navigation
function setupNavigation() {
    $('nav a').on('click', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        console.log(`Navigating to ${page}`);
        
        // Remove 'active' class from all links
        $('nav a').removeClass('active');
        // Add 'active' class to the clicked link
        $(this).addClass('active');
        
        switch(page) {
            case 'home':
                loadHomePage();
                break;
            case 'reports':
                loadReportsPage();
                break;
            case 'about':
                loadAboutPage();
                break;
        }
    });
}

// Function to load home page
function loadHomePage() {
    console.log("Loading home page...");
    pageTransition(() => {
        $('#mainContent').empty().append('<div id="coinList" class="row"></div>');
        fetchCoins();
        toggleSearchVisibility(true);
    });
}

// Function to fetch coins from API
function fetchCoins() {
    console.log("Fetching coins...");
    $('#loadingSpinner').show(); // Show the spinner
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/markets',
        method: 'GET',
        data: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false
        },
        success: function(data) {
            console.log(`Fetched ${data.length} coins.`);
            displayCoins(data);
            $('#loadingSpinner').hide(); // Hide the spinner
        },
        error: function(error) {
            console.error('Error fetching coins:', error);
            handleApiError(error, 'Failed to fetch coins');
            $('#loadingSpinner').hide(); // Hide the spinner even in case of error
        }
    });
}

// Function to handle API errors
function handleApiError(error, message) {
    console.error(message, error);
    if (error.status === 0 || error.status === 429) {
        handleCorsError();
    } else {
        $('#mainContent').html(`
            <p class="error-message">
                Sorry, we encountered an issue loading the data. Please try again later.
            </p>
        `);
    }
}

// Function to handle CORS errors
function handleCorsError() {
    $('#mainContent').html(`
        <div class="alert alert-warning" role="alert">
            <h4 class="alert-heading">Data Access Error</h4>
            <p>We're having trouble accessing the cryptocurrency data due to API limitations.</p>
            <hr>
            <p class="mb-0">Please try again in a few minutes or contact support if the issue persists.</p>
        </div>
    `);
}

// Function to display coins
function displayCoins(coins) {
    console.log(`Displaying ${coins.length} coins.`);
    const coinList = $('#coinList');
    coins.forEach((coin, index) => {
        const card = createCoinCard(coin);
        coinList.append(card);
        // Add fade-in animation with delay based on index
        setTimeout(() => {
            $(`#coin-${coin.id}`).addClass('show');
            $(`#coin-${coin.id} .coin-logo`).addClass('show');
        }, index * 100);
        // Set the toggle state based on selectedCoins
        if (selectedCoins.some(selectedCoin => selectedCoin.id === coin.id)) {
            $(`#toggle-${coin.id}`).prop('checked', true);
        }
    });
}

// Function to create a coin card
function createCoinCard(coin) {
    return `
        <div class="col-sm-6 col-md-4 col-lg-3 mb-4 coin-card" id="coin-${coin.id}">
            <div class="card h-100">
                <div class="card-body d-flex flex-column">
                    <img src="${coin.image || 'images/coin-placeholder.png'}" alt="${coin.name}" class="coin-logo mb-2">
                    <h5 class="card-title">${coin.symbol.toUpperCase()} - ${coin.name}</h5>
                    <p class="card-text">Rank: ${coin.market_cap_rank}</p>
                    <button class="btn btn-primary more-info-btn mt-auto" data-id="${coin.id}">More Info</button>
                    <div class="form-check form-switch mt-2">
                        <input class="form-check-input coin-toggle" type="checkbox" id="toggle-${coin.id}" data-id="${coin.id}" data-symbol="${coin.symbol}">
                        <label class="form-check-label" for="toggle-${coin.id}">Add to Report</label>
                    </div>
                    <div class="more-info-content mt-2" style="display: none;"></div>
                </div>
            </div>
        </div>
    `;
}

// Function to setup infinite scroll
function setupInfiniteScroll() {
    $(window).scroll(function() {
        if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
            $('.coin-card:hidden').slice(0, 8).each(function(index) {
                $(this).addClass('show');
                $(this).find('.coin-logo').addClass('show');
            });
        }
    });
}

// Function to setup search functionality
function setupSearch() {
    const $searchInput = $('#searchInput');
    const $searchResults = $('<div id="searchResults" class="dropdown-menu"></div>').insertAfter($searchInput);
    
    $searchInput.on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        if (searchTerm.length > 0) {
            let matchingCoins;
            if ($('#liveReportChart').length) {
                // On reports page
                matchingCoins = selectedCoins.filter(coin => 
                    coin.symbol.toLowerCase().includes(searchTerm) || 
                    coin.id.toLowerCase().includes(searchTerm)
                );
            } else {
                // On home page
                matchingCoins = $('.coin-card').filter(function() {
                    const coinName = $(this).find('.card-title').text().toLowerCase();
                    return coinName.includes(searchTerm);
                });
            }
            
            $searchResults.empty();
            matchingCoins.forEach(function(coin) {
                let coinName;
                if (coin instanceof jQuery) {
                    coinName = coin.find('.card-title').text();
                } else {
                    coinName = `${coin.symbol.toUpperCase()} - ${coin.id}`;
                }
                $searchResults.append(`<a class="dropdown-item" href="#">${coinName}</a>`);
            });
            $searchResults.show();
        } else {
            $searchResults.hide();
        }
    });
    
    $searchResults.on('click', 'a', function(e) {
        e.preventDefault();
        const selectedCoin = $(this).text();
        $searchInput.val(selectedCoin);
        $searchResults.hide();
        filterCoins(selectedCoin);
    });
    
    $('#searchButton').on('click', function(e) {
        e.preventDefault();
        const searchTerm = $searchInput.val();
        filterCoins(searchTerm);
    });
}

// Function to filter coins based on search term
function filterCoins(searchTerm) {
    if ($('#liveReportChart').length) {
        // On reports page
        $('#selectedCoinsList > div').each(function() {
            const coinData = $(this).find('.card-title, .card-text').text().toLowerCase();
            if (coinData.includes(searchTerm.toLowerCase())) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    } else {
        // On home page
        $('.coin-card').each(function() {
            const coinSymbol = $(this).find('.card-title').text();
            if (coinSymbol.toLowerCase().includes(searchTerm.toLowerCase())) {
                $(this).fadeIn();
            } else {
                $(this).fadeOut();
            }
        });
    }
}

// Function to load reports page
function loadReportsPage() {
    console.log("Loading reports page...");
    pageTransition(() => {
        $('#mainContent').empty().append(`
            <h2>Real-time Cryptocurrency Prices</h2>
            <div class="row">
                <div class="col-md-12">
                    <canvas id="liveReportChart"></canvas>
                </div>
            </div>
            <h2>Bitcoin Price Chart (30 Days)</h2>
            <div class="row">
                <div class="col-md-12">
                    <canvas id="bitcoinChart"></canvas>
                </div>
            </div>
            <h2>Selected Coins</h2>
            <div id="selectedCoinsList" class="row mt-3"></div>
        `);
        console.log("Reports page HTML appended.");
        displaySelectedCoins();
        initLiveReport();
        initBitcoinChart();
        setupSearch();
        toggleSearchVisibility(true);
    });
}

// Function to display selected coins
function displaySelectedCoins() {
    const coinsList = $('#selectedCoinsList');
    coinsList.empty();
    selectedCoins.forEach(coin => {
        const coinInfo = coinCache[coin.id] || {};
        coinsList.append(`
            <div class="col-md-4 mb-2 coin-card" data-coin="${coin.id}">
                <div class="card">
                    <div class="card-body">
                        <img src="${coinInfo.image || 'images/coin-placeholder.png'}" alt="${coin.symbol}" class="coin-logo mb-2">
                        <h5 class="card-title">${coin.symbol.toUpperCase()}</h5>
                        <p class="card-text">${coin.id}</p>
                        <p>USD: $${coinInfo.usdPrice || 'Loading...'}</p>
                        <p>EUR: €${coinInfo.eurPrice || 'Loading...'}</p>
                        <p>ILS: ₪${coinInfo.ilsPrice || 'Loading...'}</p>
                        <button class="btn btn-danger btn-sm remove-from-report" data-id="${coin.id}" data-symbol="${coin.symbol}">Remove</button>
                    </div>
                </div>
            </div>
        `);
        if (!coinInfo.usdPrice) {
            fetchMoreInfo(coin.id);
        }
    });
    
    // Add button to add more coins
    coinsList.append(`
        <div class="col-md-4 mb-2">
            <div class="card add-coin-card">
                <div class="card-body text-center">
                    <button class="btn btn-primary add-coin-btn">Add Coin</button>
                </div>
            </div>
        </div>
    `);

    // Add event listener for the add coin button
    $('.add-coin-btn').on('click', function() {
        loadHomePage();
    });

    // Trigger logo animation
    setTimeout(() => {
        $('.coin-logo').addClass('show');
    }, 100);
}

// Function to initialize live report
function initLiveReport() {
    console.log("Initializing live report...");
    if (selectedCoins.length === 0) {
        console.log("No coins selected for live report.");
        $('#liveReportChart').html('<p>No coins selected for live report. Please select coins from the home page.</p>');
        return;
    }

    console.log("Selected coins:", selectedCoins);

    const ctx = document.getElementById('liveReportChart');
    if (!ctx) {
        console.error("Cannot find liveReportChart element");
        return;
    }

    // Destroy existing chart if it exists
    if (liveChart) {
        liveChart.destroy();
    }

    console.log("Creating new Chart instance");
    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: selectedCoins.map(coin => ({
                label: coin.symbol,
                data: [],
                borderColor: getRandomColor(),
                fill: false
            }))
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Live Coin Prices (USD)'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second'
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    console.log("Live report chart initialized.");
    updateLiveReport();
}

// Function to initialize Bitcoin chart
function initBitcoinChart() {
    console.log("Initializing Bitcoin chart...");
    const ctx = document.getElementById('bitcoinChart');
    if (!ctx) {
        console.error("Cannot find bitcoinChart element");
        return;
    }

    // Fetch Bitcoin price data for the last 30 days
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
        method: 'GET',
        data: {
            vs_currency: 'usd',
            days: 30
        },
        success: function(data) {
            const prices = data.prices.map(price => ({
                x: new Date(price[0]),
                y: price[1]
            }));

            bitcoinChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Bitcoin Price',
                        data: prices,
                        borderColor: '#F7931A',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: 'Bitcoin Price Chart (30 Days)'
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            },
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Price (USD)'
                            }
                        }
                    }
                }
            });
        },
        error: function(error) {
            console.error('Error fetching Bitcoin price data:', error);
            $('#bitcoinChart').html('<p>Failed to load Bitcoin price data. Please try again later.</p>');
        }
    });
}

// Function to update live report
function updateLiveReport() {
    if (!liveChart || selectedCoins.length === 0) return;

    const symbols = selectedCoins.map(coin => coin.symbol.toUpperCase()).join(',');
    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`;

    $.ajax({
        url: url,
        method: 'GET',
        success: function(data) {
            console.log("Received live report data:", data);
            const time = new Date();

            if (typeof data === 'object' && data !== null) {
                selectedCoins.forEach((coin, index) => {
                    const upperSymbol = coin.symbol.toUpperCase();
                    if (data[upperSymbol] && data[upperSymbol].USD) {
                        liveChart.data.datasets[index].data.push({
                            x: time,
                            y: data[upperSymbol].USD
                        });
                    } else {
                        console.warn(`Nodata for ${upperSymbol}`);
                    }
                });

                liveChart.data.datasets.forEach(dataset => {
                    if (dataset.data.length > 30) dataset.data.shift();
                });

                liveChart.update();
            } else {
                console.error("Received data is not in the expected format:", data);
            }

            setTimeout(updateLiveReport, 2000);
        },
        error: function(error) {
            console.error('Error updating live report:', error);
            setTimeout(updateLiveReport, 2000);
        }
    });
}

// Function to load about page
function loadAboutPage() {
    console.log("Loading about page...");
    pageTransition(() => {
        $('#mainContent').empty().append(`
            <div class="container">
                <h2 class="mb-4">About Me and the Project</h2>
                <div class="row">
                    <div class="col-md-4">
                        <img src="images/profile.jpg" alt="Elad Ya'akobovitch" class="img-fluid rounded-circle mb-3">
                    </div>
                    <div class="col-md-8">
                        <h3>Developer</h3>
                        <h4>Elad Ya'akobovitch</h4>
                        <p>37-year-old full-stack developer with certification from John Bryce College. Passionate about technology, creativity, and personal growth. Currently seeking opportunities in the high-tech industry.</p>
                        
                        <h4 class="mt-4">Contact Information</h4>
                        <ul>
                            <li>Email: eladhiteclearning@gmail.com</li>
                            <li>LinkedIn: <a href="https://www.linkedin.com/in/eladyaakobovitchcodingdeveloper/" target="_blank">linkedin.com/in/eladyaakobovitchcodingdeveloper</a></li>
                            <li>GitHub: <a href="https://github.com/eladjak" target="_blank">github.com/eladjak</a></li>
                            <li>Phone: +972 52-542-7474</li>
                        </ul>
                        
                        <h4 class="mt-4">Cryptocurrency App</h4>
                        <p>This cryptocurrency app provides real-time data on various cryptocurrencies using the CoinGecko API. It includes features such as dynamic HTML generation, AJAX requests, and real-time charts.</p>
                        
                        <h5>Features</h5>
                        <ul>
                            <li>Coins Page: Shows a list of the top cryptocurrencies by market cap.</li>
                            <li>Reports Page: Displays a chart of the current prices of selected cryptocurrencies.</li>
                            <li>About Page: Provides information about the developer and the purpose of the app.</li>
                        </ul>
                        
                        <h5>Technologies Used</h5>
                        <ul>
                            <li>HTML5, CSS3, JavaScript (ES6+)</li>
                            <li>jQuery 3.6.0</li>
                            <li>Bootstrap 5.3.0</li>
                            <li>Chart.js 3.9.1</li>
                            <li>Moment.js 2.29.4</li>
                            <li>SweetAlert2 11.7.12</li>
                            <li>CoinGecko API</li>
                            <li>CryptoCompare API</li>
                        </ul>
                        
                        <p>For more details, setup instructions, and contribution guidelines, please visit the <a href="https://github.com/eladjak/cryptocurrency-app" target="_blank">GitHub repository</a>.</p>
                    </div>
                </div>
            </div>
        `);
        toggleSearchVisibility(false);
    });
}

// Event delegation for More Info button
$(document).on('click', '.more-info-btn', function() {
    const coinId = $(this).data('id');
    const infoContent = $(this).siblings('.more-info-content');
    toggleMoreInfo(coinId, infoContent);
});

// Event delegation for coin toggle
$(document).on('change', '.coin-toggle', function() {
    const coinId = $(this).data('id');
    const coinSymbol = $(this).data('symbol');
    const isChecked = $(this).prop('checked');
    toggleCoinSelection(coinId, coinSymbol, isChecked);
});

// Event delegation for removing coins from report
$(document).on('click', '.remove-from-report', function() {
    const coinId = $(this).data('id');
    const coinSymbol = $(this).data('symbol');
    selectedCoins = selectedCoins.filter(coin => coin.id !== coinId);
    saveSelectedCoins();
    $(this).closest('.col-md-4').fadeOut(400, function() {
        $(this).remove();
        initLiveReport();
    });
});

// Function to toggle more info
function toggleMoreInfo(coinId, infoContent) {
    console.log(`Toggling more info for coin ${coinId}`);
    if (coinCache[coinId] && Date.now() - coinCache[coinId].timestamp < 120000) {
        displayMoreInfo(coinCache[coinId], infoContent);
    } else {
        fetchMoreInfo(coinId, infoContent);
    }
}

// Function to fetch more info from API
function fetchMoreInfo(coinId, infoContent) {
    console.log(`Fetching more info for coin ${coinId}`);
    $.ajax({
        url: `https://api.coingecko.com/api/v3/coins/${coinId}`,
        method: 'GET',
        success: function(data) {
            console.log(`Received more info for coin ${coinId}:`, data);
            coinCache[coinId] = {
                image: data.image.small,
                usdPrice: data.market_data.current_price.usd,
                eurPrice: data.market_data.current_price.eur,
                ilsPrice: data.market_data.current_price.ils,
                timestamp: Date.now()
            };
            if (infoContent) {
                displayMoreInfo(coinCache[coinId], infoContent);
            }
            updateCoinCard(coinId);
        },
        error: function(error) {
            console.error('Error fetching more info:', error);
            handleApiError(error, 'Failed to fetch more coin info');
        }
    });
}

// Function to display more info
function displayMoreInfo(coinInfo, infoContent) {
    infoContent.html(`
        <p>USD: $${coinInfo.usdPrice}</p>
        <p>EUR: €${coinInfo.eurPrice}</p>
        <p>ILS: ₪${coinInfo.ilsPrice}</p>
    `);
    infoContent.slideToggle();
}

// Function to update coin card
function updateCoinCard(coinId) {
    const coinInfo = coinCache[coinId];
    const card = $(`#selectedCoinsList [data-coin="${coinId}"]`);
    if (card.length) {
        card.find('img').attr('src', coinInfo.image);
        card.find('p:contains("USD")').text(`USD: $${coinInfo.usdPrice}`);
        card.find('p:contains("EUR")').text(`EUR: €${coinInfo.eurPrice}`);
        card.find('p:contains("ILS")').text(`ILS: ₪${coinInfo.ilsPrice}`);
    }
}

// Function to toggle coin selection
function toggleCoinSelection(coinId, coinSymbol, isChecked) {
    console.log(`Toggling coin ${coinId} (${coinSymbol}), checked: ${isChecked}`);
    if (isChecked) {
        if (selectedCoins.length < 5) {
            selectedCoins.push({ id: coinId, symbol: coinSymbol });
            saveSelectedCoins();
        } else {
            // Uncheck the toggle
            $(`#toggle-${coinId}`).prop('checked', false);
            // Show modal to remove a coin
            showRemoveCoinModal(coinId, coinSymbol);
        }
    } else {
        selectedCoins = selectedCoins.filter(coin => coin.id !== coinId);
        saveSelectedCoins();
    }
    
    console.log("Selected coins:", selectedCoins);
    
    // Update reports if on reports page
    if ($('#liveReportChart').length) {
        loadReportsPage();
    }
}

// Function to show remove coin modal
function showRemoveCoinModal(newCoinId, newCoinSymbol) {
    console.log(`Showing remove coin modal for new coin ${newCoinId} (${newCoinSymbol})`);
    console.log("Current selectedCoins:", selectedCoins);

    let html = `
        <div class="coin-management">
            <p class="mb-3">You can't select more than 5 coins. Please remove a coin before adding a new one.</p>
            <div id="coinRemoveList" class="mb-3">
                ${selectedCoins.map(coin => {
                    if (coin && coin.symbol) {
                        return `
                            <div class="selected-coin-item d-flex justify-content-between align-items-center mb-2">
                                <span class="coin-name">${coin.symbol.toUpperCase()}</span>
                                <button class="btn btn-outline-danger btn-sm remove-coin-btn" data-id="${coin.id}" data-symbol="${coin.symbol}">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    } else {
                        console.error("Invalid coin object:", coin);
                        return '';
                    }
                }).join('')}
            </div>
        </div>
    `;

    Swal.fire({
        title: 'Manage Selected Coins',
        html: html,
        showCancelButton: true,
        cancelButtonText: 'Close',
        showConfirmButton: false,
        customClass: {
            container: 'coin-management-modal',
            title: 'coin-management-title',
            cancelButton: 'btn btn-outline-secondary'
        },
        focusCancel: true
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            console.log("User closed coin management modal");
            updateToggles();
        }
    });

    // Event delegation for remove coin buttons
    $(document).on('click', '.remove-coin-btn', function() {
        const coinToRemove = $(this).data('id');
        console.log(`Removing coin ${coinToRemove}`);
        selectedCoins = selectedCoins.filter(coin => coin.id !== coinToRemove);
        $(this).closest('.selected-coin-item').remove();
        updateToggles();
        saveSelectedCoins();
        if (selectedCoins.length < 5) {
            selectedCoins.push({ id: newCoinId, symbol: newCoinSymbol });
            $(`#toggle-${newCoinId}`).prop('checked', true);
            saveSelectedCoins();
            Swal.close();
            if ($('#liveReportChart').length) {
                loadReportsPage();
            } else {
                updateToggles();
            }
        }
    });
}

// Function to update toggles based on selected coins
function updateToggles() {
    $('.coin-toggle').each(function() {
        const coinId = $(this).data('id');
        $(this).prop('checked', selectedCoins.some(coin => coin.id === coinId));
    });
}

// Function to generate a random color for chart lines
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to handle page transitions with improved animation
function pageTransition(callback) {
    $('#mainContent').removeClass('page-transition');
    $('#mainContent').addClass('fade-out');
    setTimeout(() => {
        $('#mainContent').empty();
        callback();
        $('#mainContent').removeClass('fade-out').addClass('fade-in page-transition');
        setTimeout(() => {
            $('#mainContent').removeClass('fade-in');
        }, 500);
    }, 300);
}

// Function to handle parallax effect
function handleParallax() {
    $(window).on('scroll', function() {
        const scrolled = $(window).scrollTop();
        $('body').css('background-position-y', -(scrolled * 0.3) + 'px');
    });
}

// Function to save selected coins to localStorage
function saveSelectedCoins() {
    localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
}

// Function to load selected coins from localStorage
function loadSelectedCoins() {
    const savedCoins = localStorage.getItem('selectedCoins');
    if (savedCoins) {
        try {
            const parsedCoins = JSON.parse(savedCoins);
            if (Array.isArray(parsedCoins) && parsedCoins.every(coin => coin.id && coin.symbol)) {
                selectedCoins = parsedCoins;
            } else {
                console.error("Invalid data in localStorage, resetting selectedCoins");
                selectedCoins = [];
            }
        } catch (error) {
            console.error("Error parsing selectedCoins from localStorage:", error);
            selectedCoins = [];
        }
        updateToggles();
    }
}

// Function to format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
}

// Function to debounce API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to fetchMoreInfo function
const debouncedFetchMoreInfo = debounce(fetchMoreInfo, 300);

// Function to add shine animation to the logo
function addShineAnimation() {
    if (!$('#cryptoLogo .shine').length) {
        $('#cryptoLogo').append('<div class="shine"></div>');
    }
}

// Call handleParallax on document ready
$(document).ready(function() {
    handleParallax();
});