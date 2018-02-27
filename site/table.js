//iife
(function() {
  const url = "ws://localhost:8011/stomp";
  const client = Stomp.client(url);

  function connectCallback() {
    let records = [];
    let midPrice = [];

    client.subscribe("/fx/prices", function response(message) {
      let currentRecord = JSON.parse(message.body);

      //find duplicate records
      let duplicateRecord = findDuplicateRecord(records, currentRecord);

      //sort record based on last change bid
      records = sortCurrencyRecords(records);

      if (duplicateRecord) {
        let updatedRecord = updateRecord(records, currentRecord);
        records = [];
        records = updatedRecord;

        document.getElementById("stomp-status").innerHTML = createTable(
          records
        );
        insertMidPrice(midPrice, currentRecord);
        drawSparkLine(midPrice);
      } else {
        records.push(currentRecord);
        midPrice.push({ name: currentRecord.name, midPrice: [] });

        document.getElementById("stomp-status").innerHTML = createTable(
          records
        );
        insertMidPrice(midPrice, currentRecord);
        drawSparkLine(records);
      }
    });

    document.getElementById("stomp-status").innerHTML =
      "It has now successfully connected to a stomp server serving price updates for some foreign exchange currency pairs.";
  }

  //insert mid price into respective currency pair for 30 second records
  function insertMidPrice(midPrice, currentRecord) {
    let updatedRecord = midPrice.map(function(record) {
      if (record.name === currentRecord.name) {
        if (record.midPrice.length < 10) {
          return record.midPrice.push(
            (currentRecord.bestBid + currentRecord.bestAsk / 2).toFixed(4)
          );
        } else {
          record.midPrice.shift();
          return record.midPrice.push(
            (currentRecord.bestBid + currentRecord.bestAsk / 2).toFixed(4)
          );
        }
      }
      return record;
    });

    return updatedRecord;
  }

  //sort currency record based on lastChangeBid price
  function sortCurrencyRecords(records) {
    return records.sort(function(a, b) {
      return a.lastChangeBid - b.lastChangeBid;
    });
  }

  //update record with new value
  function updateRecord(records, currentRecord) {
    let updatedRecord = records.map(function(record) {
      if (record.name === currentRecord.name) {
        return Object.assign({}, record, currentRecord);
      }
      return record;
    });

    return updatedRecord;
  }

  //draw sparkline based on id of row
  function drawSparkLine(records) {
    records.map(function(d) {
      const exampleSparkline = document.getElementById(
        "midPrice" + d.name + ""
      );
      Sparkline.draw(exampleSparkline, d.midPrice);
    });
  }

  //find duplicate record into currency record array.
  function findDuplicateRecord(records, currentRecord) {
    let duplicateRecord = records.find(function(record) {
      return record.name === currentRecord.name;
    });

    return duplicateRecord;
  }

  //create table based on data send by stomp server
  function createTable(currencyRecords) {
    let currencyRows = currencyRecords.map(function(currencyRecord) {
      return (
        "<tr><td>" +
        currencyRecord.name +
        "</td><td>" +
        currencyRecord.bestBid.toFixed(4) +
        "</td><td>" +
        currencyRecord.bestAsk.toFixed(4) +
        "</td><td>" +
        currencyRecord.lastChangeBid.toFixed(4) +
        "</td><td>" +
        currencyRecord.lastChangeAsk.toFixed(4) +
        '</td><td id="midPrice' +
        currencyRecord.name +
        '"></td><td>' +
        (currencyRecord.bestBid / currencyRecord.bestAsk / 2).toFixed(4) +
        "</td></tr>"
      );
    });

    let table =
      '<div class="container"><table class="table table-hover table-sm table-bordered table-responsive"><tr><th>Name</th><th>Current Best Bid Price</th><th>Current Best Ask Price</th><th>Current Bid Last Changed</th><th>Current Ask Last Changed</th><th>Spgarkline</th><th>Midprice</th></tr>' +
      currencyRows +
      "</table>";

    return table;
  }

  //connect to stomp server
  client.connect({}, connectCallback, function(error) {
    alert(error.headers.message);
  });
})();
