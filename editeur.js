var typesAutorisés = [
	'document',
	'titre',
	'paragraphe',
	'important',
	'texte'
];

$(function() {
	$(".éditeur-semantique").each(function(i,e) {
		éditeurSémantique(e);
	});
});

$.fn.extend()

function éditeurSémantique(textareaÉditeur) {
	conteneur = $('<div class="conteneur-esem"/>');
	éditeur = $(textareaÉditeur).removeClass("éditeur-semantique").addClass("éditeur");
	aperçu = $('<div class="aperçu"/>');
	
	éditeur.replaceWith(conteneur);
	conteneur.append(aperçu);
	conteneur.append(éditeur);
	
	var xml = $("<document/>").append(éditeur.text()); // Est-ce portable ?.
	éditeur.text("");
	
	function init() {
		xmlVersDom(xml, aperçu);
		sélectionElement(aperçu.children().first()); // assertion : type == Document
	}
	
	function xmlVersDom(xml,htmlParent) {
		var htmlElem = créerElement(xml.get(0).tagName.toLowerCase()).appendTo(htmlParent);
		
		htmlElem.click(function(e) {
			sélectionElement(htmlElem);
			return false;
		});
		
		if (xml.get(0).tagName.toLowerCase() == "texte") {
			htmlElem.append(xml.text());
		}
		
		xml.children().each(function(i,xmlElem) {
			xmlVersDom($(xmlElem),htmlElem);
		});
	}
	
	function créerElement(type) {
		return $('<span class="element"/>')
			.addClass(type)
			.data("type", type);
	}
	
	function sélectionElement(e) {
		if (e.data("type") == "texte") {
			éditeurAttacher(e);
		} else {
			éditeurDétacher();
		}
	}
	
	function éditeurAttacher(elem) {
		éditeurDétacher();
		éditeur.val(elem.text());
		
		var éditeurValPrécédente = éditeur.val();
		function éditeurModif(e) {
			if (éditeur.val() != éditeurValPrécédente)
				elem.text(éditeur.val());
		}
		
		éditeur.bind("propertychange input cut paste keypress", éditeurModif);
	}
	
	function éditeurDétacher() {
		éditeur.unbind("propertychange input cut paste keypress");
		éditeur.val("");
	}
	
	init();
}