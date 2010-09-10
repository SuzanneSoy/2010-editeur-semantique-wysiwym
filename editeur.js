$(function() {
	$(".éditeur-semantique").each(function(i,e) {
		éditeurSémantique(e);
	});
});

/* ===== Types de noeud ===== */

var MULTI_LIGNE = 0;
var MONO_LIGNE = 1;
var EN_LIGNE = 2;

$.fn.extend({
	appendVuesEnfants: function (modèle, typeVue) {
		for (var i = 0; i < modèle.contenu.length; i++) {
			this.append(modèle.contenu[i].créerVue(typeVue));
		}
		return this;
	}
});

function squeletteAperçuNoeud(noeud) {
	var ct = {};
	ct[MULTI_LIGNE] = { tag: 'div',  tagc: 'div',  cat: 'multi-ligne' };
	ct[MONO_LIGNE]  = { tag: 'div',  tagc: 'span', cat: 'mono-ligne' };
	ct[EN_LIGNE]    = { tag: 'span', tagc: 'span', cat: 'en-ligne' };
	ct = ct[typesNoeud[noeud.type].catégorie];
	
	var html = $('<' + ct.tag + ' class="noeud"/>').addClass(noeud.type).addClass(ct.cat);
	var étiquette = $('<span class="étiquette"/>').appendTo(html);
	var contenu = $('<' + ct.tagc + ' class="contenu"/>').appendTo(html);
	
	html.click(function(){console.log("plop", noeud); return false; });
	
	return html;
}

var typeNoeudDéfaut = {
	catégorie: EN_LIGNE,
	enfants: ['texte'],
	vues: {
		aperçu: function() {
			return squeletteAperçuNoeud(this)
				.children(".contenu").appendVuesEnfants(this, 'aperçu').end();
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

function TypesNoeud(typesNoeud) {
	for (var i in typesNoeud) {
		this[i] = $.extend({}, typeNoeudDéfaut, typesNoeud[i]);
		this[i].vues = $.extend({}, typeNoeudDéfaut.vues, typesNoeud[i].vues);
	}
}

var typesNoeud = new TypesNoeud({
	document: {
		catégorie: MULTI_LIGNE,
		enfants: ['titre', 'paragraphe'],
		// surcharge de la _fonction_ "vue" (pas le tableau "vues").
		vue: function() {
			return $('<div class="conteneur-esem"/>').appendVuesEnfants(this, 'aperçu');
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
				var ret = squeletteAperçuNoeud(this);
				$('<span class="cible"/>').text(this.propriétés.cible).appendTo(ret.children(".contenu"));
				$('<span class="texte"/>').text(this.propriétés.texte).appendTo(ret.children(".contenu"));
				return ret;
			},
			édition: function() {
				return édition_noeud(this).prepend('<input type="text" value="<<<propriétés.cible>>>"/>')
			},
		},
		propriétés: {
			interne: false,
			cible: 'http://www.example.com/',
			texte: 'texte du lien'
		}
	},
	texte: {
		catégorie: EN_LIGNE,
		enfants: [],
		vues: {
			aperçu: function(typeVue) {
				return $('<span class="noeud texte en-ligne"/>')
					.text(this.propriétés.texte);
				//  .bind_text(this.texte);
			},
			édition: function(n) {
				return $("<textarea/>").bind_val(n.texte);
			},
		},
		propriétés: {
			texte: ''
		}
	}
});

/* ===== Textarea => éditeur sémantique ===== */

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

var créerDocument = function() {
	var document = {
		noeudActif: null,
		pressePapier: null,
		setNoeudActif : function(noeud) {
			// TODO : vue.setActif(bool);
			document.noeudActif = null;
		},
		créerNoeud: function(type) {
			return {
				type: type,
				contenu: [],
				propriétés: $.extend(true, {}, typesNoeud[type].propriétés),
				
				// Navigation
				parent: null,
				document: document,
				
				// Modèle : fonctions principales.
				positionDansParent: function() {
					return this.parent().contenu.indexOf(this); // Mouais...
				},
				insérer: function(noeud, position) {
					noeud.parent = this;
					this.contenu.splice(position, 0, noeud);
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
					this.propriétés[propriété] = valeur;
					// TODO : modifier la vue
				},
				
				// Modèle : Fonctions secondaires :
				
				supprimer: function() {
					return this.parent.supprimerEnfant(this.positionDansParent());
				},
				insérerAvant: function(noeud) { // insère noeud avant this (à l'extérieur).
					this.parent.insérer(noeud, this.positionDansParent());
				},
				insérerAprès: function(noeud) { // insère noeud après this (à l'extérieur).
					this.parent.insérer(noeud, this.positionDansParent() + 1);
				},
				insérerDébut: function(noeud) { // insère noeud au début de this (à l'intérieur).
					this.insérer(noeud, 0);
				},
				insérerFin: function(noeud) { // insère noeud à la fin de this (à l'intérieur).
					this.insérer(noeud, this.contenu.length);
				},
				emballer: function(noeud) { // insère noeud à la place de this, et met this dedans.
					var pos = this.positionDansParent();
					var parent = this.parent;
					var n = parent.supprimerEnfant(pos);
					parent.insérer(noeud, pos);
					noeud.insérer(n, 0); // TODO ? noeud.setContenu(this);
				},
				remplacer: function () {
					var pos = this.positionDansParent();
					var parent = this.parent;
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
					return typesNoeud[type].vue.call(this, typeVue);;
				}
			}
		}
	};
	$.extend(document, document.créerNoeud("document"));
	document.document = document; // 42 !
	return document;
}

function xmlVersModèle(xml) {
	function recursion(xml, parent) {
		var tag = xml.tagName.toLowerCase(); // TODO : si tagName n'est pas toujours un "vrai" string, .toString() .
		var ret = parent.document.créerNoeud(tag);
		
		for (var i in ret.propriétés) {
			var propval = $(xml).attr(i);
			if (typeof propval != "undefined") {
				ret.modifierPropriété(i, propval);
			}
		}
		
		if (tag == "texte") {
			ret.modifierPropriété("texte", $(xml).text());
		}
		
		$(xml).children().each(function (i,e) {
			ret.insérerFin(recursion(e, ret));
		});
		
		return ret;
	}

	return recursion(xml, créerDocument());
}

/* Modèle :

{ document, noeudActif, pressePapiers }

// Todo : où indiquer TypeVue (aperçu, édition, boutons(?), arbre) ?

vue.supprimerVue();
vue.supprimerEnfant(position);
noeud.créerVue(typeVue);
vue.insérerEnfant(noeud_enfant, position) { insérer_dans_vue_courante_à_position(créerVue(noeud_enfant), position); }
vue.setPropriété(propriété, valeur);

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
