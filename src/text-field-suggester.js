if (typeof Sensis === 'undefined')
	Sensis = {};

(function () {
	var defaults = {
		suggestionFetchDelayMs: 100
	};


	Sensis.TextFieldSuggester = function (name, textInputSelector, maxSuggestions, suggestionFetchFunc) {
		var that = this;

		this.name = name;
		this.textField = $(textInputSelector);
		this.maxSuggestions = maxSuggestions;
		this.suggestionFetchFunc = suggestionFetchFunc;
		this.suggestionFetchDelayMs = defaults.suggestionFetchDelayMs;
		this.suggestions = [];
		this.suggestionUpdateTimeout = null;
		this.selectedSuggestionIndex = -1;
		this.bestSuggestion = '';
		this.lastValue = '';
		this.lastValueWithCompletion = '';

		this.completion = this.createCompletion();
		this.suggestionList = this.createSuggestionList();

		$('body').append(this.completion, this.suggestionList);

		this.reposition();
		this.updateSuggestions();

		this.textField.focus(function () {
			that.fetchSuggestions(that.textField.val());
			that.updateSuggestions();
			that.reportValueUpdated(that.textField.val());
		});

		this.textField.blur(function () {
			if (that.textField.val() !== '' && that.bestSuggestion.toLowerCase().indexOf(that.textField.val().toLowerCase()) === 0)
				that.textField.val(that.textField.val() + that.bestSuggestion.substring(that.textField.val().length));
			that.updateSuggestions();
		});

		this.textField.keydown(function (e) {
			var value;

			// Enter key pressed
			if (e.keyCode === 13) {
				e.preventDefault();
				that.cancelCompletion();
				that.hideSuggestions();
			}

			else {
				value = that.textField.val();

				if (value.length < that.lastValue.length)
					that.updateCompletion();
			}
		});

		this.textField.keyup(function (event) {
			var value = that.textField.val();

			if (value === that.lastValue) {

				switch (event.keyCode) {

					// Up arrow
					case 38:
						if (that.selectedSuggestionIndex >= 0) {
							if (--that.selectedSuggestionIndex < 0)
								that.selectedSuggestionIndex = -1;
						}
						else
							that.selectedSuggestionIndex = that.suggestions.length - 1;
						that.updateSelectedSuggestion();
						return;

					// Down arrow
					case 40:
						if (that.selectedSuggestionIndex >= 0) {
							if (++that.selectedSuggestionIndex >= that.suggestions.length)
								that.selectedSuggestionIndex = -1;
						}
						else if (that.suggestions.length > 0)
							that.selectedSuggestionIndex = 0;
						else
							that.selectedSuggestionIndex = -1;
						that.updateSelectedSuggestion();
						return;

					default:
						return;
				}
			}

			that.lastValue = value;

			that.fetchSuggestions(value);
			that.updateCompletion();

			if (!that.suggestionUpdateTimeout)
				that.reportValueUpdated(value);
		});

		// Focus on the text field when the completion overlay is clicked, for
		// browsers that don't support CSS pointer-events property.
		$('.' + this.name + 'Completion').click(function () {
			that.textField.focus();
		});

		$('.' + this.name + 'Suggestions .suggestion').mousedown(function () {
			that.updateValue($(this).find('.label').text());
		});
	};

	Sensis.TextFieldSuggester.prototype.cancelCompletion = function () {
		var value = this.textField.val();
		this.bestSuggestion = value;
		this.updateCompletion();
		this.reportValueUpdated(value);
	};

	Sensis.TextFieldSuggester.prototype.createCompletion = function () {
		var completion = $(document.createElement('div')),
			prefix = $(document.createElement('span')),
			suffix = $(document.createElement('span'));

		completion.addClass(this.name + 'Completion');
		completion.css({
			'position': 'absolute',
			'padding': '0',
			'margin': '0',
			'font-family': this.textField.css('font-family'),
			'font-size': this.textField.css('font-size'),
			'pointer-events': 'none',
			'overflow': 'hidden',
			'white-space': 'nowrap'
		});

		prefix.addClass('prefix');
		prefix.css({
			'margin-left': '1px',
			'padding-left': this.textField.css('padding-left'),
			'line-height': this.textField.innerHeight() + 'px',
			'visibility': 'hidden'
		});
		completion.append(prefix);

		suffix.addClass('suffix');
		suffix.css({
			'line-height': this.textField.innerHeight() + 'px'
		});
		completion.append(suffix);

		return completion;
	};

	Sensis.TextFieldSuggester.prototype.createSuggestionList = function () {
		var list = $(document.createElement('ul')),
			i,
			item,
			icon,
			label;

		list.addClass(this.name + 'Suggestions');
		list.css({
			'position': 'absolute',
			'list-style': 'none',
			'margin': '0',
			'padding': '0'
		});

		for (i = 0; i < this.maxSuggestions; ++i) {
			item = $(document.createElement('li'));
			item.addClass('suggestion');

			icon = $(document.createElement('img'));
			icon.addClass('icon');
			item.append(icon);

			label = $(document.createElement('span'));
			label.addClass('label');
			item.append(label);

			list.append(item);
		}

		return list;
	};

	Sensis.TextFieldSuggester.prototype.fetchSuggestions = function (value) {
		var that = this;

		if (this.suggestionUpdateTimeout) {
			window.clearTimeout(this.suggestionUpdateTimeout);
			this.suggestionUpdateTimeout = null;
		}

		this.suggestionUpdateTimeout = window.setTimeout(function () {
			that.suggestionFetchFunc(value, function (suggestions) {
				if (that.suggestionUpdateTimeout) {
					that.updateSuggestions(suggestions);
					that.reportValueUpdated(that.textField.val());
				}
			});
		}, this.suggestionFetchDelayMs);
	};

	Sensis.TextFieldSuggester.prototype.hideSuggestions = function () {
		this.suggestionList.css({ 'display': 'none' });
	};

	Sensis.TextFieldSuggester.prototype.interacting = function () {
		return document.activeElement === this.textField.get(0);
	};

	Sensis.TextFieldSuggester.prototype.reportValueUpdated = function (value) {
		value = value + this.completion.find('.suffix').text();
		if (value !== this.lastValueWithCompletion) {
			this.lastValueWithCompletion = value;
			this.valueUpdated(value);
		}
	};

	Sensis.TextFieldSuggester.prototype.reposition = function () {
		this.completion.css({
			'top': (this.textField.offset().top + (this.textField.outerWidth() - this.textField.innerWidth()) / 2) + 'px',
			'left': (this.textField.offset().left + (this.textField.outerHeight() - this.textField.innerHeight()) / 2) + 'px',
			'width': this.textField.outerWidth() + 'px',
			'height': this.textField.outerHeight() + 'px'
		});

		this.suggestionList.css({
			'top': (this.textField.offset().top + this.textField.outerHeight()) + 'px',
			'left': this.textField.offset().left + 'px',
			'width': this.textField.width() + 'px'
		});
	};

	Sensis.TextFieldSuggester.prototype.showSuggestions = function () {
		this.suggestionList.css({ 'display': 'block' });
	};

	Sensis.TextFieldSuggester.prototype.updateCompletion = function () {
		var value = this.textField.val(),
			i = this.bestSuggestion.toLowerCase().indexOf(value.toLowerCase()),
			suffix,
			suggestion;

		if (i === 0 && value !== '' && this.bestSuggestion !== '' && this.interacting()) {
			suffix = this.bestSuggestion.substring(value.length);

			if (this.selectedSuggestionIndex < 0) {
				suggestion = this.suggestionList.find('.suggestion').get(0);
				if (suggestion)
					$(suggestion).addClass('suggested');
			}
		}
		else {
			suffix = '';
			this.suggestionList.find('.suggestion').removeClass('suggested');
		}

		this.completion.find('.prefix').text(value);
		this.completion.find('.suffix').text(suffix);
	};

	Sensis.TextFieldSuggester.prototype.updateSelectedSuggestion = function () {
		var suggestion;

		this.suggestionList.find('.suggestion').removeClass('selected');

		if (this.selectedSuggestionIndex >= 0) {
			this.suggestionList.find('.suggestion').removeClass('suggested');

			suggestion = $(this.suggestionList.find('.suggestion').get(this.selectedSuggestionIndex));
			suggestion.addClass('selected');
			this.updateValue(suggestion.find('.label').text());
		}
	};

	Sensis.TextFieldSuggester.prototype.updateSuggestions = function (suggestions) {
		var suggestionItems = this.suggestionList.find('.suggestion'),
			i,
			suggestion,
			icon,
			label;

		if (typeof suggestions === 'undefined')
			suggestions = this.suggestions;
		else
			this.suggestions = suggestions.slice(0, this.maxSuggestions);

		if (suggestions.length === 0 || !this.interacting())
			this.hideSuggestions();
		else
			this.showSuggestions();

		for (i = 0; i < suggestions.length && i < this.maxSuggestions; ++i) {
			suggestion = $(suggestionItems.get(i));

			icon = suggestion.find('.icon');
			if (suggestions[i].icon) {
				icon.attr('src', suggestions[i].icon);
				icon.css({ 'visibility': 'visible' });
			}
			else
				icon.css({ 'visibility': 'hidden' });

			label = suggestion.find('.label');
			label.text(suggestions[i].label);

			suggestion.css({ 'display': 'block' });
		}

		for (; i < this.maxSuggestions; ++i) {
			suggestion = $(suggestionItems.get(i));
			suggestion.css({ 'display': 'none' });
		}

		if (suggestions.length > 0)
			this.bestSuggestion = suggestions[0].label;
		else
			this.bestSuggestion = '';

		this.selectedSuggestionIndex = -1;
		this.updateSelectedSuggestion();
		this.updateCompletion();
	};

	Sensis.TextFieldSuggester.prototype.updateValue = function (value) {
		this.bestSuggestion = value;
		this.textField.val(value);
		this.updateCompletion();

		if (value !== this.lastValue) {
			this.lastValue = value;
			this.reportValueUpdated(value);
		}
	};

	Sensis.TextFieldSuggester.prototype.valueUpdated = function (value) {};

})();