var MULTI_LIGNE = 0;
var MONO_LIGNE = 1;
var EN_LIGNE = 2;
var typesNoeud = {
	document:   { catégorie: MULTI_LIGNE, enfants: ['titre', 'paragraphe'] },
	titre:      { catégorie: MONO_LIGNE,  enfants: ['important', 'texte'] },
	paragraphe: { catégorie: MULTI_LIGNE, enfants: ['important', 'texte'] },
	important:  { catégorie: EN_LIGNE,    enfants: ['texte'] },
	lien:       { catégorie: EN_LIGNE,    enfants: ['texte'], 'propriétés': ['cible'] },
	texte:      { catégorie: EN_LIGNE,    enfants: [] },
	
	lien: {
		aperçu: function(n) {
			return aperçu_noeud(n)
				.children(".étiquette")
				.append('<img src="..." alt="">');
		},
		édition: function(n) {
			return édition_noeud(n).prepend('<input type="text" value="propriété <cible>"/>')
		},
		propriétés: {
			'interne': false,
			'cible': 'http://example.com/'
		}
	},
	texte: {
		aperçu: function(n) {
			return $("<span/>").bind_text(n.texte);
		},
		édition: function(n) {
			return $("<textarea/>").bind_val(n.texte);
		},
		propriétés: {
			texte: new valeur("")
		}
	}
};

/* Modèle :

{ document, noeudActif, pressePapiers }

nouveauNoeud()

insérerAvant(n)
insérerAprès(n)
insérerDébut(n)
insérerFin(n)
insérerAutour(n)

supprimer()
remplacer(n1, n2, ...) // remplacer par n1, ... nn
supprimer_en_gardant_le_contenu() // TODO : trouver un nom meilleur.

modifierType(nouveau_type); // TODO ! lien -> texte ou important ou ... doit préserver le texte du lien !

*/

function valeur(v) { // TODO : voir si ça peut marcher aussi pour des éléments complets (pas que du texte).
	var valeur = v;
	var écouteurs = [];
	var f = function(v) {
		if (typeof v == "undefined") {
			return valeur;
		} else {
			var oldv = v;
			valeur = v;
			$(écouteurs).each(function(i,f){
				f(v, oldv);
			});
		}
	};
	f.ajouterÉcouteur = function(rappel) {
		écouteurs.push(rappel);
	}
	/* TODO : piquer le code de : http://github.com/jsmaniac/2010-ide-langage-grunt-flin607/blob/master/jside4/callbacks.js */
	return f;
}

function aperçu_noeud(n) {
	switch (noeud.type.catégorie) {
	case MULTI_LIGNE:
		var tag='div';
		var cat='multi-ligne';
		break;
	case MONO_LIGNE:
		var tag='div';
		var cat='mono-ligne';
		break;
	case EN_LIGNE:
		var tag='span';
		var cat='en-ligne';
		break;
	}
	
	var html = $('<' + tag + ' class="noeud"/>');
	html.addClass(n.type.classe).addClass(cat);
	$('<span class="étiquette"/>').text(n.type.étiquette).appendTo(html);
	$('<span class="contenu"/>').text(n.type.étiquette).appendTo(html);
	
	return html;
}

function unique_enfant_texte(n) {
	return (n.enfants().length == 1 && n.enfants(0).type == 'texte')
}

function édition_noeud_texte(n) {
	return $("<textarea/>");
}





$(function() {
	$(".éditeur-semantique").each(function(i,e) {
		éditeurSémantique(e);
	});
});

function éditeurSémantique(textareaÉditeur) {
	var conteneur = $('<div class="conteneur-esem"/>');
	var éditeur = $(textareaÉditeur).removeClass("éditeur-semantique").addClass("éditeur");
	var boutons = $('<div class="boutons"/>');
	var aperçu = $('<div class="aperçu"/>');
	var elementActif = null;
	
	éditeur.replaceWith(conteneur);
	conteneur.append(aperçu);
	conteneur.append(boutons);
	conteneur.append(éditeur);
	
	var xml = $("<document/>").append(éditeur.text()); // Est-ce portable ?.
	éditeur.text("");
	
	function init() {
		xmlVersDom(xml, aperçu);
		sélectionElement(aperçu.children().first()); // assertion : type == Document
		bouton("important", function(debut, fin) {
			var t = elementActif.text();
			var t1 = créerElement("texte").text(t.substring(0,debut));
			var t2 = créerElement("texte").text(t.substring(debut,fin));
			var t2important = créerElement("important").append(t2);
			var t3 = créerElement("texte").text(t.substring(fin));
			elementActif.replaceWith(t1);
			t2important.insertAfter(t1);
			t3.insertAfter(t2important);
			sélectionElement(t2);
		});
	}
	
	function bouton(texte, fonction) {
		boutons.append($('<input type="button" class="bouton"/>').val(texte).click(function(e) {
			fonction(éditeur.get(0).selectionStart, éditeur.get(0).selectionEnd);
		}));
	}
	
	function xmlVersDom(xml,htmlParent) {
		var htmlElem = créerElement(xml.get(0).tagName.toLowerCase()).appendTo(htmlParent);
		
		if (xml.get(0).tagName.toLowerCase() == "texte") {
			htmlElem.append(xml.text());
		}
		
		xml.children().each(function(i,xmlElem) {
			xmlVersDom($(xmlElem),htmlElem);
		});
	}
	
	function créerElement(type) {
		var el = $('<span class="element"/>')
			.addClass(type)
			.data("type", type)
			.click(function(e) {
				sélectionElement(el);
				return false;
			});
		return el;
	}
	
	function sélectionElement(e) {
		elementActif = e;
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
