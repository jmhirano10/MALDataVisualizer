/*Canvas Contexts for Graphs*/
const movie     = document.getElementById('movie')
const tv        = document.getElementById('tv')

/*Movie Variables*/
var mType       = 'movie'
var mTopAmt     = 25
var mYears      = []
var mIncluded   = ['AvgScore','AvgScrdBy','AvgMems']
var mYearlyData = [] 
var mData       = {
    avgScore    : [],
    avgScrdBy   : [],
    avgMems     : []
}

/*TV Variables*/
var tType       = 'tv'
var tTopAmt     = 25
var tYears      = []
var tIncluded   = ['AvgScore','AvgScrdBy','AvgMems']
var tYearlyData = []
var tData       = {
    avgScore    : [],
    avgScrdBy   : [],
    avgMems     : []
}

/*Helpful Variables*/
var seasons     = ['winter','spring','summer','fall']
var maxYears    = 60
var avgColors   = {
    avgScoreClr : '#e37fb3',
    avgScrdByClr: '#6ddec5',
    avgMemsClr  : '#d4a261'
}

/*Form Elements*/
var tvSYearIn   = document.getElementById("tv_start_year")
var tvEYearIn   = document.getElementById("tv_end_year")
var tvUpdateBtn = document.getElementById("tv_year_update")
var mSYearIn    = document.getElementById("m_start_year")
var mEYearIn    = document.getElementById("m_end_year")
var mUpdateBtn  = document.getElementById("m_year_update")

/*Top Show/Movies for Year Variable*/
const topTVShow = document.getElementById("top_shows")
const topMovies = document.getElementById("top_movies")

/*Form Elements*/
var tvTopYear   = document.getElementById("tv_top_year")
var tvTopAmt    = document.getElementById("tv_top_amt")
var tvSortBy    = document.getElementById("tv_sort_by")
var tvTopUpdateBtn = document.getElementById("tv_top_update")
var mTopYear   = document.getElementById("m_top_year")
var mTopAmt    = document.getElementById("m_top_amt")
var mSortBy    = document.getElementById("m_sort_by")
var mTopUpdateBtn = document.getElementById("m_top_update")


/*Annual Data*/
async function getSeasonData(scores,scoredBy,members,year,season,type,topAmt){
    let currentPage = 1
    let nextPage = true
    let url = 'https://api.jikan.moe/v4/seasons/'+year+'/'+season+'?filter='+type+'&page='
    
    while(nextPage){
        let response = await fetch(url+currentPage)
        if (response.status == 429){
            console.log('429: Too Many Requests')
            await sleep(2000)
            continue
        }
        let dataset = await response.json()
        nextPage = dataset.pagination.has_next_page
        currentPage += 1
        for (let entry of dataset.data){
            insertValueSorted(scores,entry.score,topAmt)
            insertValueSorted(scoredBy,entry.scored_by,topAmt)
            insertValueSorted(members,entry.members,topAmt)
        }
        await sleep(800)
    }
    return
}

async function getYearData(year,type,topAmt){
    let scores = []
    let scoredBy = []
    let members = []
    for (let s of seasons){
        await getSeasonData(scores,scoredBy,members,year,s,type,topAmt)
    }
    return [average(scores),average(scoredBy),average(members)]
}

async function updateYearlyStats(sYear,eYear,type,top,data,years){
    let progressName = type+'Progress'
    let progessCntr = 0
    let index = 0
    let yearsToFind = createYearList(sYear,eYear,years,data)
    let totYearsFind = yearsToFind.length

    document.getElementById(progressName).value = 0
    document.getElementById(progressName).hidden = false
    document.getElementById(type).hidden = true

    for (let y of yearsToFind){
        progessCntr++
        [score,scored,member] = await getYearData(y,type,top)
        index = insertValueSorted(years,y,maxYears)
        data.avgScore.splice(index,0,score)
        data.avgScrdBy.splice(index,0,scored)
        data.avgMems.splice(index,0,member)        
        document.getElementById(progressName).value = progessCntr/totYearsFind
    }
    document.getElementById(progressName).hidden = true
    document.getElementById(type).hidden = false
}

function createYearList(sYear,eYear,years,data){
    let yearsToFind = []
    for (let y=sYear; y<=eYear; y++){
        if (!years.includes(y)){
            yearsToFind.push(y)
        }
    }
    for (let i=years.length-1; i>=0; i--){
        if (years[i] < sYear || years[i] > eYear){
            years.splice(i,1)
            data.avgScore.splice(i,1)
            data.avgScrdBy.splice(i,1)
            data.avgMems.splice(i,1)
        }
    }
    return yearsToFind
}

function updateYearlyDataset(included,data){
    let yearlyData = []

    for (let inc of included){
        let entry = {}
        if (inc == 'AvgScore'){
            entry.label = 'Average Score'
            entry.data = data.avgScore
            entry.borderColor = avgColors['avgScoreClr']
            entry.yAxisID = 'score'
        }
        else if (inc == 'AvgScrdBy'){
            entry.label = 'Average Amount of People Scoring Each Anime'
            entry.data = data.avgScrdBy
            entry.borderColor = avgColors['avgScrdByClr']
            entry.yAxisID = 'people'
        }
        else if (inc == 'AvgMems'){
            entry.label = 'Average Number of Members Per Anime'
            entry.data = data.avgMems
            entry.borderColor = avgColors['avgMemsClr']
            entry.yAxisID = 'people'
        }
        yearlyData.push(entry)
    }
    return yearlyData
}

function displayYearlyGraph(ctx,years,yearlyData){
    let newChart = new Chart(ctx,{
        type:'line',
        data: {
            labels: years,
            datasets: yearlyData
        },
        options: {
            responsive: true,
            scales: {
                score: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'MAL Score'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                people: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Users'
                    }                
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    })
    return newChart
}

async function updateYearlyMovies(sYear,eYear){
    sYear = parseInt(sYear)
    eYear = parseInt(eYear)
    await updateYearlyStats(sYear,eYear,mType,mTopAmt,mData,mYears)
    mYearlyData = updateYearlyDataset(mIncluded,mData)
    mChart.data.labels = mYears
    mChart.data.datasets = mYearlyData
    mChart.update()
}

async function updateYearlyTV(sYear,eYear){
    sYear = parseInt(sYear)
    eYear = parseInt(eYear)
    await updateYearlyStats(sYear,eYear,tType,tTopAmt,tData,tYears)
    tYearlyData = updateYearlyDataset(tIncluded,tData)
    tvChart.data.labels = tYears
    tvChart.data.datasets = tYearlyData
    tvChart.update()
}


/*Top Shows/ Movies*/
function createCard(maldata){
    let card = document.createElement('div')
    let imageDiv = document.createElement('div')
    let infoDiv = document.createElement('div')
    let image = document.createElement('img')
    let title = document.createElement('h4')
    let rating = document.createElement('p')
    let episodes = document.createElement('p')
    let duration = document.createElement('p')
    let members = document.createElement('p')
    let synopsis = document.createElement('p')
    let link = document.createElement('a')

    image.src = maldata.image
    title.textContent = maldata.title
    rating.textContent = maldata.score+' (Scored by '+maldata.scored_by+' Users)'
    episodes.textContent = maldata.episodes+' Episodes'
    duration.textContent = maldata.duration
    members.textContent = maldata.members+' members'
    synopsis.textContent = maldata.synopsis
    link.href = maldata.url
    link.textContent = 'MAL Link'
    link.target = "_blank"

    imageDiv.appendChild(image)
    infoDiv.appendChild(title)
    infoDiv.appendChild(rating)
    infoDiv.appendChild(episodes)
    infoDiv.appendChild(duration)
    infoDiv.appendChild(members)
    /*card.appendChild(synopsis)*/
    infoDiv.appendChild(link)
    infoDiv.setAttribute('class', 'info')
    card.appendChild(imageDiv)
    card.appendChild(infoDiv)
    card.setAttribute('class', 'card')
    return card
}

async function getTopSeasonData(data,year,season,type,topAmt,sortBy){
    let currentPage = 1
    let nextPage = true
    let url = 'https://api.jikan.moe/v4/seasons/'+year+'/'+season+'?filter='+type+'&page='

    while(nextPage){
        let response = await fetch(url+currentPage)
        if (response.status == 429){
            console.log('429: Too Many Requests')
            await sleep(2000)
            continue
        }
        let dataset = await response.json()
        nextPage = dataset.pagination.has_next_page
        currentPage += 1
        for (let e of dataset.data){
            let entry = {
                title:e.title,
                score:e.score,
                scored_by:e.scored_by,
                episodes:e.episodes,
                duration:e.duration,
                members:e.members,
                synopsis:e.synopsis,
                url:e.url,
                image:e.images.jpg.image_url
            }
            insertEntrySorted(data,sortBy,topAmt,entry)
        }
        await sleep(800)
    }
    return
}

async function getTopData(year,type,topAmt,sortBy){
    let data = []
    for (let s of seasons){
        await getTopSeasonData(data,year,s,type,topAmt,sortBy)
    }
    return data
}

async function updateTopTV(year,topAmt,sortBy){
    while (topTVShow.firstChild){
        topTVShow.removeChild(topTVShow.firstChild);
    }
    let data = await getTopData(year,tType,topAmt,sortBy)
    for (let i=topAmt-1; i>=0; i--){
        let card = createCard(data[i])
        topTVShow.appendChild(card)
    }
}

async function updateTopMovie(year,topAmt,sortBy){
    while (topMovies.firstChild){
        topMovies.removeChild(topMovies.firstChild);
    }
    let data = await getTopData(year,mType,topAmt,sortBy)
    for (let i=topAmt-1; i>=0; i--){
        let card = createCard(data[i])
        topMovies.appendChild(card)
    }
}

async function initializeData(){
    await updateTopTV(tvTopYear.value,tvTopAmt.value,tvSortBy.value)
    await updateTopMovie(mTopYear.value,mTopAmt.value,mSortBy.value)
    await updateYearlyTV(tvSYearIn.value,tvEYearIn.value)
    await updateYearlyMovies(mSYearIn.value,mEYearIn.value)
}


/*Form Functions*/
function sYearChange(sYear,eYear){
    if (sYear.value > 2023){
        eYear.value = 2023
        sYear.value = 2023
    }
    else if (sYear.value < 1970){
        sYear.value = 1970
    }
    else if (sYear.value > eYear.value){
        eYear.value = sYear.value
    }
}

function eYearChange(sYear,eYear){
    if (eYear.value < 1970){
        eYear.value = 1970
        sYear.value - 1970
    }
    else if (eYear > 2023){
        eYear.value = 2023
    }
    else if (eYear.value < sYear.value){
        sYear.value = eYear.value
    }
}


/*Helper Functions*/
function average(array){
    let total = 0
    let length = array.length

    for (let val of array){
        total += val
    }
    return total/length
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function insertValueSorted(array,value,maxSize){
    let length = array.length
    let added = false
    let index = 0

    if (value == null){
        return
    }
    else if (length == 0){
        array.push(value)
        return 0
    }
    for (let i in array){
        if (value <= array[i]){
            array.splice(i,0,value)
            length += 1
            added = true
            index = i
            break
        }
    }
    if (!added){
        array.push(value)
        index = length
        length += 1
    }
    if (length > maxSize){
        index--
        array.shift()
    }
    return index
}

function insertEntrySorted(array,key,maxSize,entry){
    let length = array.length
    let added = false
    let index = 0

    if (entry[key] == null){
        return
    }
    else if (length == 0){
        array.push(entry)
        return 0
    }
    for (let i in array){
        if (entry[key] <= array[i][key]){
            array.splice(i,0,entry)
            length += 1
            added = true
            index = i
            break
        }
    }
    if (!added){
        array.push(entry)
        index = length
        length += 1
    }
    if (length > maxSize){
        index--
        array.shift()
    }
    return index
}

tvSYearIn.oninput = function(){sYearChange(tvSYearIn,tvEYearIn)}
tvEYearIn.oninput = function(){eYearChange(tvSYearIn,tvEYearIn)}
tvUpdateBtn.onclick = function(){updateYearlyTV(tvSYearIn.value,tvEYearIn.value)}
mSYearIn.oninput = function(){sYearChange(mSYearIn,mEYearIn)}
mEYearIn.oninput = function(){eYearChange(mSYearIn,mEYearIn)}
mUpdateBtn.onclick = function(){updateYearlyMovies(mSYearIn.value,mEYearIn.value)}

tvTopUpdateBtn.onclick = function(){updateTopTV(tvTopYear.value,tvTopAmt.value,tvSortBy.value)}
mTopUpdateBtn.onclick = function(){updateTopMovie(mTopYear.value,mTopAmt.value,mSortBy.value)}

var mChart = displayYearlyGraph(movie,mYears,mYearlyData)
var tvChart = displayYearlyGraph(tv,tYears,tYearlyData)

initializeData()
