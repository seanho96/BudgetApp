// Budget Controller
var budgetController = (function () {
  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function () {
    return this.percentage;
  };

  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function (type) {
    var sum = 0;
    data.allItems[type].forEach(function (cur) {
      sum += cur.value;
    });
    data.totals[type] = sum;
  };

  var data = {
    allItems: {
      exp: [],
      inc: [],
    },

    totals: {
      exp: 0,
      inc: 0,
    },
    budget: 0,
    percentage: -1,
  };

  return {
    addItem: function (type, des, val) {
      var newItem, ID;

      // ID = last ID + 1

      // Create new ID
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // Create new item based on 'inc' or 'exp' type
      if (type === 'exp') {
        newItem = new Expense(ID, des, val);
      } else if (type === 'inc') {
        newItem = new Income(ID, des, val);
      }

      // Push it into our data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;
    },

    deleteItem: function (type, id) {
      var ids, index;

      // id = 6
      // ids = [1 2 4 6 8]
      // index = 3

      // difference of map to foreach method is that map returns a brand new array
      ids = data.allItems[type].map(function (current) {
        return current.id;
      });

      index = ids.indexOf(id);

      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }

      // update chart
      updateChart(data.totals.inc, data.totals.exp);
    },

    calculateBudget: function () {
      // Calculate total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');
      // calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;
      // Calculate the percentage of income that we spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }

      // update chart
      updateChart(data.totals.inc, data.totals.exp);
    },

    calculatePercentages: function () {
      /*
      a=20
      b=10
      c=40
      income=100
      a=20/100=20%
      b=10%
      c=40%
      */

      data.allItems.exp.forEach(function (cur) {
        cur.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function () {
      var allPerc = data.allItems.exp.map(function (cur) {
        return cur.getPercentage();
      });
      return allPerc;
    },



    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage,
      };
    },

    // Setting data into local storage
    storeData: function () {
      localStorage.setItem("data", JSON.stringify(data));
    },

    // Getting data from local storage
    getStoredData: function () {
      var localData = JSON.parse(localStorage.getItem("data"));
      return localData;
    },

    // Updating data structure from stored data
    updateData: function (storedData) {
      data.totals = storedData.totals;
      data.budget = storedData.budget;
      data.percentage = storedData.percentage;
    },

    getAllIDs: function () {
      var incIDs, expIDs, allIDs;

      expIDs = data.allItems.exp.map(function (cur) {
        return `exp-${cur.id}`;
      });

      incIDs = data.allItems.inc.map(function (cur) {
        return `inc-${cur.id}`;
      });

      allIDs = expIDs.concat(incIDs);

      return allIDs;
    },

    deleteAllItems: function () {
      data.allItems.exp = [];
      data.allItems.inc = [];
    },

    deleteDataFromStorage: function () {
      localStorage.clear();
    },

    testing: function () {
      console.log(data);
    },
  };
})();

// UI Controller
var UIController = (function () {
  var DOMstrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.budget__container',
    expensesPercLabel: '.item__percentage',
    dateLabel: '.budget__title--month',
    deleteAll: '.delete__all'
  };

  var formatNumber = function (num, type) {
    var numSplit, int, dec, type;
    /*
    + or 0 before number
    exactly 2 decimal points
    comma separating the thousands

    2310.4567 --> + 2,310.46
    */

    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split('.');

    int = numSplit[0];
    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); // input 2310, output 2,310
    }

    dec = numSplit[1];

    return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
  };

  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function () {
      return {
        type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
        description: document.querySelector(DOMstrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
      };
    },

    addListItem: function (obj, type) {
      // get current date
      var today;
      today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");

      var month = today.getMonth();

      var months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      today = months[month] + " " + dd;



      var html, newHtml, element;
      // Create HTML string with placeholder text

      if (type === 'inc') {
        element = DOMstrings.incomeContainer;

        html =
          '<div class="item clearfix" id="inc-%id%"><div class="item__content clearfix"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"></button></div><div class="item__edit"><button class="item__edit--btn"></button></div></div></div><div class="item__date">%date%</div></div>';
      } else if (type === 'exp') {
        element = DOMstrings.expensesContainer;

        html =
          '<div class="item clearfix" id="exp-%id%"><div class="item__content clearfix"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"></button></div><div class="item__edit"><button class="item__edit--btn"></button></div></div></div><div class="item__date">%date%</div></div>';
      }

      // Replace the placeholder text with some actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
      newHtml = newHtml.replace("%date%", today);

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },

    deleteListItem: function (selectorID) {
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);
    },

    clearFields: function () {
      var fields, fieldsArr;
      fields = document.querySelectorAll(
        DOMstrings.inputDescription + ', ' + DOMstrings.inputValue
      );

      // forEach now works on list
      //fieldsArr = Array.prototype.slice(fields);
      fields.forEach(function (current, index, array) {
        current.value = '';
      });

      fields[0].focus();
    },

    displayBudget: function (obj) {
      var type;
      obj.budget > 0 ? (type = 'inc') : (type = 'exp');

      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(
        obj.budget,
        type
      );
      document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(
        obj.totalInc,
        'inc'
      );
      document.querySelector(
        DOMstrings.expensesLabel
      ).textContent = formatNumber(obj.totalExp, 'exp');
      if (obj.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent =
          obj.percentage + '%';
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = '---';
      }
    },

    displayPercentages: function (percentages) {
      var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + '%';
        } else {
          current.textContent = '---';
        }
      });
    },

    displayMonth: function () {
      var now, year, month, months;

      now = new Date();

      months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'September',
        'October',
        'November',
        'December',
      ];
      month = now.getMonth();
      year = now.getFullYear();
      document.querySelector(DOMstrings.dateLabel).textContent =
        months[month] + ' ' + year;
    },

    changeType: function () {
      var fields = document.querySelectorAll(
        DOMstrings.inputType +
        ',' +
        DOMstrings.inputDescription +
        ',' +
        DOMstrings.inputValue
      );

      nodeListForEach(fields, function (cur) {
        cur.classList.toggle('red-focus');
      });

      document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
    },

    getDOMstrings: function () {
      return DOMstrings;
    },
  };
})();

// Global App Controller
var controller = (function (budgetCtrl, UICtrl) {
  var setupEventListeners = function () {
    var DOM = UICtrl.getDOMstrings();

    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    document.addEventListener('keypress', function (event) {
      if (event.keyCode === 13 || event.which === 13) {
        event.preventDefault(); // prevents the enter key from also triggering a click event
        ctrlAddItem();
      }
    });

    document
      .querySelector(DOM.container)
      .addEventListener('click', ctrlEditOrDeleteItem);

    document
      .querySelector(DOM.inputType)
      .addEventListener('change', UICtrl.changeType);

    document
      .querySelector(DOM.deleteAll)
      .addEventListener('click', ctrlDeleteAllItems);
  };

  var loadData = function () {
    // 1. Locate data from local storage
    var storedData = budgetCtrl.getStoredData();
    console.log(storedData);

    if (storedData) {
      // 2. insert the saved data into local storage
      budgetCtrl.updateData(storedData);

      // 3. create income items
      storedData.allItems.inc.forEach(function (cur) {
        var newIncItem = budgetCtrl.addItem("inc", cur.description, cur.value);
        UICtrl.addListItem(newIncItem, "inc");
      });

      // 4. Creating  expense items
      storedData.allItems.exp.forEach(function (cur) {
        var newExpItem = budgetCtrl.addItem("exp", cur.description, cur.value);
        UICtrl.addListItem(newExpItem, "exp");
      });

      // 5. Display the budget
      budget = budgetCtrl.getBudget();
      UICtrl.displayBudget(budget);

      // Display the percentage
      updatePercentages();

      // Using saved inc and exp data to show chart
      updateChart(
        parseInt(storedData.totals.inc),
        parseInt(storedData.totals.exp)
      );
    }
  };

  var updateBudget = function () {
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();
    // 2. Return the budget
    var budget = budgetCtrl.getBudget();
    // 3. Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function () {
    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();

    // 2. Read percentages from the budget controller
    var percentages = budgetCtrl.getPercentages();

    // 3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function () {
    var input, newItem;
    // 1. Get the field input data
    input = UICtrl.getInput();

    // Enter inputs are valid answers
    if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
      // 2. Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);
      // 3.  Add the item to the UI
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear the fields
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages
      updatePercentages();

      // 7. save to localstorage
      budgetCtrl.storeData();
    }
  };

  var ctrlEditOrDeleteItem = function (event) {
    var itemID, splitID, type, ID, input, targetBtn;

    // Getting input
    input = UIController.getInput();

    // Figuring out the button
    targetBtn = event.target;

    // Handling edit
    if (targetBtn.className === "item__edit--btn") {
      let desc,
        value,
        inputDesc,
        inputVal,
        valueString,
        splitValuesString,
        intValue,
        selectTypeElement,
        selectType;

      // traversing to description element of item
      desc = event.target.parentNode.parentNode.previousElementSibling;
      // traversing to value element of item
      value = event.target.parentNode.parentNode.firstElementChild;
      // selecting input description element
      inputDesc = document.querySelector(".add__description");
      // selecting input value element
      inputVal = document.querySelector(".add__value");
      // assigning item's description value to input's description element
      inputDesc.value = desc.textContent;
      // assigning item's value value(actual content) to input's value
      valueString = value.textContent;
      // splitting values to deal with comma in value having 4 or more digits
      splitValuesString = valueString.split(",");
      intValue = parseInt(splitValuesString[0] + splitValuesString[1]);
      inputVal.value = Math.abs(intValue);

      // Handling type input fields focus color

      selectType = document.querySelector(".add__type");
      selectTypeElement =
        event.target.parentNode.parentNode.parentNode.parentNode.id;
      if (selectTypeElement.includes("inc")) {
        selectType.value = "inc";
        UICtrl.changeType();
      } else if (selectTypeElement.includes("exp")) {
        selectType.value = "exp";
        UICtrl.changeType();
      }
    }

    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
    // works because the itemID will be coerced(converted to true) if it exists, if it doesn't, it will be coerced to false
    if (itemID) {
      // inc-1
      splitID = itemID.split('-');
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);
      // 2. Delete the item from the IU
      UICtrl.deleteListItem(itemID);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Calculate and update percentages
      updatePercentages();

      // 5. save to localstorage
      budgetCtrl.storeData();
    }
  };

  var ctrlDeleteAllItems = function () {
    var allIDs;

    // 1. Get all IDs
    allIDs = budgetCtrl.getAllIDs();

    // 2. delete the items from UI
    allIDs.forEach(function (cur) {
      UICtrl.deleteListItem(cur);
    });

    // 3. Delete all items in DS
    budgetCtrl.deleteAllItems();

    // 4. update and show the new budget
    updateBudget();

    // 5. Calculate and update percentage
    updatePercentages();

    //6. delete local storage
    budgetCtrl.deleteDataFromStorage();

    //7. Clear chart
    updateChart(1, 0);
    document.getElementsByClassName('chart').style.display = hidden;
  };


  return {
    init: function () {
      UICtrl.displayMonth();
      UICtrl.displayBudget(budgetCtrl.getBudget());
      setupEventListeners();
      loadData();
    },
  };
})(budgetController, UIController);

controller.init();
