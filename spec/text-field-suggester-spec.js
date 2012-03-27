$(document).ready(function () {
	describe('TextFieldSuggester', function () {

		var textField,
			maxSuggestions = 4,		
			suggester,
			currentValue = '';


		function arrowDown() {
			textField.trigger(new jQuery.Event('keydown', { keyCode: 40 }));
			textField.trigger(new jQuery.Event('keyup', { keyCode: 40 }));
		};

		function arrowUp() {
			textField.trigger(new jQuery.Event('keydown', { keyCode: 38 }));
			textField.trigger(new jQuery.Event('keyup', { keyCode: 38 }));
		};

		function deleteText() {
			textField.focus();
			textField.select();

			// Simulate backspace
			textField.val('');
			textField.trigger(new jQuery.Event('keydown', { keyCode: 8 }));
			textField.trigger(new jQuery.Event('keyup', { keyCode: 8 }));
		};

		function enterText(text) {
			var code,
				i;

			textField.focus();

			for (i = 0; i < text.length; ++i) {
				code = text.charCodeAt(i);
				textField.val(textField.val() + text.charAt(i));
				textField.trigger(new jQuery.Event('keydown', { keyCode: code }));
				textField.trigger(new jQuery.Event('keyup', { keyCode: code }));
			}
		};

		function fetchSuggestions(textFieldValue, callback) {
			var suggestions = [
					{ label: 'Apple', icon: 'example-images/apple.png' },
					{ label: 'Apricot', icon: null },
					{ label: 'Pear', icon: null },
					{ label: 'Banana', icon: 'example-images/banana.png' },
					{ label: 'Grape', icon: 'example-images/grape.png' },
					{ label: 'Grapefruit', icon: null },
					{ label: 'Orange', icon: null },
					{ label: 'Pineapple', icon: 'example-images/pineapple.png' },
					{ label: 'Coconut', icon: null },
					{ label: 'Lemon', icon: null },
					{ label: 'Kiwi Fruit', icon: null }
				],
				filteredSuggestions = [],
				i;

			for (i = 0; i < suggestions.length; ++i) {
				if (suggestions[i].label.toLowerCase().indexOf(textFieldValue.toLowerCase()) === 0)
					filteredSuggestions.push(suggestions[i]);
			}

			callback(filteredSuggestions);
		};

		textField = $('#theTextField');
		suggester = new Sensis.TextFieldSuggester('theTextField', '#theTextField', maxSuggestions, fetchSuggestions);

		suggester.valueUpdated = function (value) {
			currentValue = value;
		};


		it('should invoke the valueUpdated callback when the text value is updated', function () {
			runs(function () {
				deleteText();
				enterText('blah');
			});

			waitsFor(function () {
				return currentValue === 'blah';
			}, 1000);
		});

		describe('Input completion', function () {

			it('should have an element for displaying the automatically completed text', function () {
				var completion = $('.theTextFieldCompletion');

				expect(completion.length).toEqual(1);
				expect(completion.find('.prefix').length).toEqual(1);
				expect(completion.find('.suffix').length).toEqual(1);
			});

			it('should hide the completion prefix', function () {
				var prefix = $('.theTextFieldCompletion .prefix');
				expect(prefix.css('visibility')).toEqual('hidden');
			});

			it('should set the completion prefix to the entered text', function () {
				var prefix = $('.theTextFieldCompletion .prefix');

				runs(function () {
					deleteText();
				});

				waitsFor(function () {
					return prefix.text() === '';
				}, 1000);

				runs(function () {
					enterText('gr');
				});

				waitsFor(function () {
					return prefix.text() === 'gr';
				}, 1000);
			});

			it('should set the completion suffix to the remainder of the first suggestion', function () {
				var suffix = $('.theTextFieldCompletion .suffix');

				runs(function () {
					deleteText();
				});

				waitsFor(function () {
					return suffix.text() === '';
				}, 1000);

				runs(function () {
					enterText('kiwi');
				});

				waitsFor(function () {
					return suffix.text() === ' Fruit';
				}, 1000);
			});

			it('should set the text to the full completion when the text field is blurred', function () {
				var suffix = $('.theTextFieldCompletion .suffix');

				runs(function () {
					deleteText();
					enterText('a');
				});

				waitsFor(function () {
					return suffix.text() === 'pple';
				});

				runs(function () {
					textField.blur();
				});

				waitsFor(function () {
					return textField.val() === 'apple';
				}, 1000);
			});
		});

		describe('Value suggestion', function () {
			var suggestionList = $('.theTextFieldSuggestions');

			it('should have an element for displaying the suggestions', function () {
				expect(suggestionList.length).toEqual(1);
			});

			it('should have an element for each suggestion item according to the max suggestions', function () {
				var items = suggestionList.find('.suggestion');
				expect(items.length).toEqual(maxSuggestions);
			});

			it('should have an icon and a label for each suggestion item', function () {
				var items = suggestionList.find('.suggestion'),
					item,
					i;

				for (i = 0; i < items.length; ++i) {
					item = $(items[i]);
					expect(item.find('.icon').length).toEqual(1);
					expect(item.find('.label').length).toEqual(1);
				}
			});

			it('should show the suggestions list when the text field is focused and hide it when blurred', function () {
				runs(function () { textField.focus() });

				waitsFor(function () { return suggestionList.css('display') === 'block' }, 500);

				runs(function () { $('#anotherTextField').focus() });

				waitsFor(function () { return suggestionList.css('display') === 'none' }, 500);
			});

			it('should show the suggestions with a matching prefix when the text field is typed into', function () {
				var items = suggestionList.find('.suggestion'),
					item,
					i;

				// Type 'a' and expect Apple and Apricot

				runs(function () {
					deleteText();
					enterText('a');
				});

				waitsFor(function () {
					return $(items[2]).css('display') === 'none' && $(items[0]).find('.label').text() === 'Apple';
				}, 1000);

				runs(function () {
					item = $(items[0]);
					expect(item.find('.label').text()).toEqual('Apple');
					expect(item.find('.icon').attr('src')).toEqual('example-images/apple.png');
					expect(item.find('.icon').css('visibility')).toEqual('visible');

					item = $(items[1]);
					expect(item.find('.label').text()).toEqual('Apricot');
					expect(item.find('.icon').attr('src')).toBeFalsy();
					expect(item.find('.icon').css('visibility')).toEqual('hidden');
				});

				// Keep typing 'pp' and expect only Apple

				runs(function () {
					enterText('pp');
				});

				waitsFor(function () {
					return $(items[1]).css('display') === 'none';
				}, 1000);

				runs(function () {
					item = $(items[0]);
					expect(item.find('.label').text()).toEqual('Apple');
					expect(item.find('.icon').attr('src')).toEqual('example-images/apple.png');
				});
			});

			it('should mark the first suggestion with a CSS class if it matches the entered text', function () {
				var first = $(suggestionList.find('.suggestion').get(0));

				// Type a letter which matches a couple of things

				runs(function () {
					deleteText();
					enterText('a');
				});

				waitsFor(function () {
					return first.hasClass('suggested');
				});

				runs(function () {
					expect(suggestionList.find('.suggested').length).toEqual(1);
				});

				// Type another letter which doesn't match anything

				runs(function () {
					enterText('z');
				});

				waitsFor(function () {
					return !first.hasClass('suggested');
				});
			});

			it('should cycle through suggestions by adding a CSS class when the down arrow key is pressed', function () {
				var items = suggestionList.find('.suggestion');

				runs(function () { deleteText() });
				waitsFor(function () { return $(items[3]).css('display') === 'block' && suggestionList.find('.suggestion.selected').length === 0 }, 1000);

				runs(function () { arrowDown() });
				waitsFor(function () { return $(items[0]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowDown() });
				waitsFor(function () { return $(items[1]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowDown() });
				waitsFor(function () { return $(items[2]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowDown() });
				waitsFor(function () { return $(items[3]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowDown() });
				waitsFor(function () { return suggestionList.find('.suggestion.selected').length === 0 }, 1000);
			});

			it('should cycle through suggestions by adding a CSS class when the up arrow key is pressed', function () {
				var items = suggestionList.find('.suggestion');

				runs(function () { deleteText() });
				waitsFor(function () { return $(items[3]).css('display') === 'block' && suggestionList.find('.suggestion.selected').length === 0 }, 1000);

				runs(function () { arrowUp() });
				waitsFor(function () { return $(items[3]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowUp() });
				waitsFor(function () { return $(items[2]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowUp() });
				waitsFor(function () { return $(items[1]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowUp() });
				waitsFor(function () { return $(items[0]).hasClass('selected') && suggestionList.find('.suggestion.selected').length === 1 }, 1000);

				runs(function () { arrowUp() });
				waitsFor(function () { return suggestionList.find('.suggestion.selected').length === 0 }, 1000);
			});
		});
	});
});