import { templates, select, classNames } from "../settings.js";
import utils from "../utils.js";
import AmountWidget from "./AmountWidget.js";



  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.dom = {};

      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);

      
    }

    initAccordion() {
      const thisProduct = this;
      const clickableTrigger = thisProduct.element.querySelector('.product__header');
      clickableTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        const activeProducts = document.querySelectorAll('.product.active');
        activeProducts.forEach(product => {
          if (product !== thisProduct.element) {
            product.classList.remove('active');
          }
        });
        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);

      let price = thisProduct.data.price;

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId];

          const optionImage = thisProduct.element.querySelector(`.${paramId}-${optionId}`);

          if (optionImage) {
            if (formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId)) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

          if (formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId) && !option.default) {
            price += option.price;
          } else if (!formData.hasOwnProperty(paramId) || !formData[paramId].includes(optionId) && option.default) {
            price += option.price;
          }
        }
      }
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }

    getElements() {
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelectorAll(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }


    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        params: {},
        price: thisProduct.priceElem.innerHTML, 
        priceSingle: thisProduct.data.price, 
      };
      return productSummary;
    }
    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.form);

      const params = {};

      for (let paramId in thisProduct.data.params) {

        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {},
        };

        for (let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected =
            formData[paramId] && formData[paramId].includes(optionId);
          if (optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  
  
    addToCart(){
      const thisProduct = this;
      const cartProduct = thisProduct.prepareCartProduct();
      cartProduct.params = thisProduct.prepareCartProductParams();
      //app.cart.add(cartProduct);

      const event = new CustomEvent('add-to-cart', {
        bubbles: true,
        detail: {
          product: thisProduct.prepareCartProduct(),
        },
      }
      );
      thisProduct.element.dispatchEvent(event);
   }
    }
  

  export default Product;