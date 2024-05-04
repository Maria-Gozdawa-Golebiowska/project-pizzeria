import {select, settings} from "../settings.js"


class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();

      if (thisWidget.input.value !== '' && !isNaN(thisWidget.input.value)) {
        thisWidget.setValue(thisWidget.input.value);
      } else {
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }
    }

    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);


      thisWidget.value = parseInt(thisWidget.input.value) || settings.amountWidget.defaultValue;
    }

    setValue(value) {
      const thisWidget = this;

      if (isNaN(value)) {
        value = 1;
      } else {
        value = parseInt(value);
        if (value < settings.amountWidget.defaultMin) {
          value = settings.amountWidget.defaultMin;
        } else if (value > settings.amountWidget.defaultMax) {
          value = settings.amountWidget.defaultMax;
        }
      }

      thisWidget.value = value;
      thisWidget.input.value = thisWidget.value;

      if (!isNaN(value) && value >= settings.amountWidget.defaultMin && value <= settings.amountWidget.defaultMax) {
        thisWidget.announce();
      }
    }


    initActions() {
      const thisWidget = this;
    
      thisWidget.input.addEventListener('change', () => {
        const value = thisWidget.input.value !== '' ? thisWidget.input.value : settings.amountWidget.defaultValue;
        thisWidget.setValue(value);
      });
      thisWidget.linkDecrease.addEventListener('click', (event) => {
        event.preventDefault();
        const newValue = thisWidget.input.value !== '' ? thisWidget.input.value - 1 : settings.amountWidget.defaultValue - 1;
        thisWidget.setValue(newValue);
      });

      thisWidget.linkIncrease.addEventListener('click', (event) => {
        event.preventDefault();
        const newValue = thisWidget.input.value !== '' ? parseInt(thisWidget.input.value) + 1 : settings.amountWidget.defaultValue + 1;
        thisWidget.setValue(newValue);
      });
      
    }
    
    announce() {
      const thisWidget = this;
      const event = new Event('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  export default AmountWidget;