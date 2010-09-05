var MULTI_LIGNE = 0;
var MONO_LIGNE = 1;
var EN_LIGNE = 2;

$.fn.extend({
	appendVuesEnfants: function (modèle, typeVue) {
		for (var i = 0; i < modèle.contenu.length; i++) {
			this.append(modèle.contenu[i].créerVue(typeVue));
		}
	}
});

var typesNoeud = {
	document: {
		catégorie: MULTI_LIGNE,
		enfants: ['titre', 'paragraphe'],
		// surcharge de la _fonction_ "vue" (pas le tableau "vues").
		vue: function() {
			var ret = $('<div class="conteneur-esem"/>');
			ret.appendVuesEnfants(this, 'aperçu');
			return ret;
		}
	},
	titre: {
		catégorie: MONO_LIGNE,
		enfants: ['important', 'texte'],
	},
	paragraphe: {
		catégorie: MULTI_LIGNE,
		enfants: ['important', 'texte'],
	},
	important: {
		catégorie: EN_LIGNE,
		enfants: ['texte'],
	},
	lien: {
		catégorie: EN_LIGNE,
		enfants: ['texte'],
		vues: {
			aperçu: function() {
				var ret = $('<span class="noeud lien en-ligne"/>');
				$('<span class="cible"/>').text(this.propriétés.cible).appendTo(ret);
				$('<span class="texte"/>').text(this.texte).appendTo(ret);
				return ret;
			},
			édition: function() {
				return édition_noeud(this).prepend('<input type="text" value="<<<propriétés.cible>>>"/>')
			},
		},
		propriétés: {
			'interne': false,
			'cible': 'http://example.com/'
		}
	},
	texte: {
		catégorie: EN_LIGNE,
		enfants: [],
		vues: {
			aperçu: function(typeVue) {
				return $('<span class="noeud texte en-ligne"/>')
					.text(this.texte);
				//  .bind_text(this.texte);
			},
			édition: function(n) {
				return $("<textarea/>").bind_val(n.texte);
			},
		}
	}
};

var typeNoeudDéfaut = {
	catégorie: EN_LIGNE,
	enfants: ['texte'],
	vues: {
		aperçu: function() {
			var ct = {};
			ct[MULTI_LIGNE] = { tag: 'div', cat: 'multi-ligne' };
			ct[MONO_LIGNE] = { tag: 'div', cat: 'mono-ligne' };
			ct[EN_LIGNE] = { tag: 'span', cat: 'en-ligne' };
			ct = ct[typesNoeud[this.type].catégorie];
			
			var html = $('<' + ct.tag + ' class="noeud"/>');
			html.addClass(this.type);
			html.addClass(ct.cat);
			html.appendVuesEnfants(this, 'aperçu');
			return html;
		},
		edition: function() {
			return $('<div class="info">Cliquez sur du texte pour le modifier.</div>');
		}
	},
	vue: function (typeVue) {
		return typesNoeud[this.type].vues[typeVue].call(this, typeVue);
	},
	propriétés: {}
}

function nettoyerTypesNoeud(typesNoeud) {
	var tn = {};
	
	for (var i in typesNoeud) {
		tn[i] = $.extend({}, typeNoeudDéfaut, typesNoeud[i]);
		tn[i].vues = $.extend({}, typeNoeudDéfaut.vues, typesNoeud[i].vues);
	}

	return tn;
}

typesNoeud = nettoyerTypesNoeud(typesNoeud);

$(function() {
	$(".éditeur-semantique").each(function(i,e) {
		éditeurSémantique(e);
	});
});

function éditeurSémantique(textareaOrigine) {
	// XML -> modèle
	var textareaOrigine = $(textareaOrigine);
	var xml = $("<document/>").append(textareaOrigine.val()); // Est-ce portable ?.
	var modèle = xmlVersModèle(xml.get(0));
	
	// Vue
	var vue = modèle.créerVue(null);
	textareaOrigine.replaceWith(vue);
	
	// Debug
	m = modèle;
	v = vue;
}

function xmlVersModèle(xml) {
	function recursion(xml, parent, document) {
		var tag = xml.tagName.toLowerCase(); // TODO : si tagName n'est pas toujours un "vrai" string, .toString() .
		var ret = {
			type: tag,
			texte: (tag == "texte") ? $(xml).text() : '',
			contenu: $(xml).children().map(function (i,e) {
				return recursion(e, {p:ret}, document);
			}).get(),
			propriétés: typesNoeud[tag].propriétés,
			
			// Navigation
			parent: function() { return parent.p; },
			document: function() { return document.d; },

			// Modèle : fonctions principales.
			positionDansParent: function() {
				return this.parent().contenu.indexOf(this); // Mouais...
			},
			insérer: function(noeud, position) {
				this.contenu.splice(position, 0, noeud);
				this.contenu[position].parent() = this;
				// TODO : modifier la vue
			},
			supprimerEnfant: function(position) {
				return this.contenu.splice(position, 1);
			},
			modifierType: function(nouveauType) {
				// TODO : lien -> (texte ou important ou ...) doit préserver le texte du lien.
				// TODO : vérifier si le parent peut bien contenir ce type
				this.type = nouveauType;
				// TODO : modifier la vue
			},
			modifierPropriété: function(propriété, valeur) {
				// TODO : vérifier si ce type peut avoir cette propriété
				this[propriété] = valeur;
				// TODO : modifier la vue
			},

			// Modèle : Fonctions secondaires :

			supprimer: function() {
				return this.parent().supprimerEnfant(this.positionDansParent());
			},
			insérerAvant: function(noeud) { // insère noeud avant this (à l'extérieur).
				this.parent().insérer(noeud, this.positionDansParent());
			},
			insérerAprès: function(noeud) { // insère noeud après this (à l'extérieur)
					this.parent().insérer(noeud, this.positionDansParent() + 1);
			},
			insérerDébut: function(noeud) { // insère noeud au début de this (à l'intérieur)
				this.insérer(noeud, 0);
			},
			insérerFin: function(noeud) { // insère noeud à la fin de this (à l'intérieur)
				this.insérer(noeud, this.contenu.length);
			},
			emballer: function(noeud) { // insère noeud à la place de this, et met this dedans
				var pos = this.positionDansParent();
				var parent = this.parent();
				var n = parent.supprimerEnfant(pos);
				parent.insérer(noeud, pos);
				noeud.insérer(n, 0); // TODO ? noeud.setContenu(this);
			},
			remplacer: function () {
				var pos = this.positionDansParent();
				var parent = this.parent();
				parent.supprimerEnfant(pos);
				for (var i = 0; i < arguments.length; i++) {
					parent.insérer(arguments[i], pos++);
				}
			},
			déballer: function() { // Contraire de emballer : supprime this, mais garde le contenu.
				var c = [];
				for (var i = 0; i < this.contenu.length; i++) {
					c[i] = this.supprimerEnfant(i); // TODO : l'insertion devrait elle-même supprimer le noeud s'il est déjà inséré quelque part.
				}
				this.remplacer.apply(this, c);
			},

			// Vue
			créerVue: function(typeVue) {
				surcharge = typesNoeud[tag].vue;
				if (typeof surcharge == "function") {
					return surcharge.call(this, typeVue);
				} else if (typeof surcharge == "object" && typeof surcharge[typeVue] == "function") {
					return surcharge[typeVue].call(this);
				} else {
					var ret = $('<div/>').text("" + typeVue);
					for (var i = 0; i < this.contenu.length; i++) {
						ret.append(this.contenu[i].créerVue('aperçu'));
					}
					return ret;
				}
			}
		};
		
		for (var i in ret.propriétés) {
			var propval = $(xml).attr(i);
			if (typeof propval != "undefined") {
				ret.propriétés[i]
			}
		}
		return ret;
	}

	var _doc = {d: 42};
	var _par = {p: 42};
	doc = recursion(xml, _par, _doc);
	_doc.d = doc;
	_par.p = doc;
	
	return doc;
}

/* Modèle :

{ document, noeudActif, pressePapiers }

// Todo : où indiquer TypeVue (aperçu, édition, boutons(?), arbre) ?

vue.supprimerVue();
vue.supprimerEnfant(position);
noeud.créerVue(typeVue);
vue.insérerEnfant(noeud_enfant, position) { insérer_dans_vue_courante_à_position(créerVue(noeud_enfant), position); }
vue.setPropriété(propriété, valeur);
vue.setActif(bool);
document.noeudActif(noeud); // ?
document.créerVue($(html_element));

=================

// ???
n = nouveauNoeud();
nparent.attacherÀPosition(n,3);
nparent.détacherPosition(3); // ?
n.détacher();                // ?

=================

// Contrôleur :
noeud.document.nouveauNoeud()

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

function unique_enfant_texte(n) {
	return (n.enfants().length == 1 && n.enfants(0).type == 'texte')
}

function édition_noeud_texte(n) {
	return $("<textarea/>");
}





function éditeurSémantique_(textareaÉditeur) {
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
