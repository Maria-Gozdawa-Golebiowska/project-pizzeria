import { templates } from "../settings.js";
import utils from "../utils.js";

class Home {
    constructor(element){
        const thisHome = this;

        thisHome.render(element)
    }

    render(element){
        const thisHome = this;

        thisHome.dom = {};

        thisHome.dom.wrapper = element;

        const generatedHTML = templates.home(thisHome.dom.wrapper);

        const generatedDOM = utils.createDOMFromHTML(generatedHTML)

        thisHome.dom.wrapper.appendChild(generatedDOM);

    }
}

export default Home;