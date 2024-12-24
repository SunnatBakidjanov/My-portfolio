function main() {
	'use strict'
	const logo = document.getElementById('logo')

	const homePage = document.getElementById('page-1')
	const homePageBtn = document.getElementById('home-page-btn')

	const changeLanguageButton = document.getElementById('translator')

	const allElements = document.querySelectorAll('*')

	const tickingState = {}
	const clickState = {}
	const scrollState = {}
	const heightValue = {}

	let isAnimationStopped = false
	let isLanguageRussian = false
	let isSwitchAnimation = true
	let isScrollAnimation = false

	const seenElements = new Set()

	function handlePageChangeOnClick(event, element, elementKey, startingHeight, startCallback, resetCallback) {
		const target = event.target
		const currentTarget = event.currentTarget

		if (!clickState[elementKey]) clickState[elementKey] = { newPage: 'home', previousPage: 'home', isClicked: false }

		scrollState[elementKey] = { scrolState: false }

		const allowedButtons = ['logo', 'home-page-btn', 'uses-page-btn', 'resume-page-btn', 'about-me-page-btn']

		const pageMapping = {
			'home-page-btn': 'home',
			'uses-page-btn': 'uses',
			'resume-page-btn': 'resume',
			'about-me-page-btn': 'about-me',
			[logo.id]: 'home',
		}

		clickState[elementKey].newPage = pageMapping[target.id] || pageMapping[currentTarget.id] || null

		if (clickState[elementKey].newPage === clickState[elementKey].previousPage) return
		if (!allowedButtons.includes(target.id)) return

		clickState[elementKey].previousPage = clickState[elementKey].newPage

		if (clickState[elementKey].previousPage) {
			if (!isAnimationStopped) {
				resetCallback(clickState[elementKey].previousPage)

				seenElements.clear()

				allElements.forEach(element => element.removeAttribute('style'))

				clickState[elementKey].isClicked = false
			}
		}

		if (document.documentElement.clientWidth > 1000) {
			clickState[elementKey].isClicked = true

			window.requestAnimationFrame(() => {
				if (handleVisibilityChange(element, startingHeight, elementKey)) {
					startCallback(clickState[elementKey].newPage)

					scrollState[elementKey].scrolState = true
				}
			})
		} else {
			const onBurgerAnimationEnd = event => {
				if (event.animationName === 'nav-container-burger-close') {
					clickState[elementKey].isClicked = true

					if (handleVisibilityChange(element, startingHeight, elementKey)) {
						startCallback(clickState[elementKey].newPage)

						scrollState[elementKey].scrolState = true
					}

					document.removeEventListener('animationend', onBurgerAnimationEnd)
				}
			}

			document.addEventListener('animationend', onBurgerAnimationEnd)
		}
	}

	function handlePageChangeOnScroll(element, elementKey, startingHeight, startCallback) {
		if (!scrollState[elementKey]) scrollState[elementKey] = { scrolState: false }

		if (scrollState[elementKey].scrolState) return

		if (handleVisibilityChange(element, startingHeight, elementKey)) {
			if (!scrollState[elementKey].scrolState) {
				scrollState[elementKey].scrolState = true

				startCallback()
			}
		}
	}

	function visibleOnLoad(element, elementKey, startingHeight, startCallback) {
		if (!tickingState[elementKey]) {
			tickingState[elementKey] = { ticking: false }
		}

		if (handleVisibilityChange(element, startingHeight, elementKey)) {
			if (!tickingState[elementKey].ticking) {
				window.requestAnimationFrame(() => {
					startCallback()

					scrollState[elementKey] = { scrolState: true }
					tickingState[elementKey].ticking = false
				})
				tickingState[elementKey].ticking = true
			}
		}
	}

	function handleVisibilityChange(element, startingHeight, elementKey) {
		const rect = element.getBoundingClientRect()

		if (!heightValue[elementKey]) {
			heightValue[elementKey] = { value: startingHeight }
		}

		const isVisible =
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight - heightValue[elementKey].value || document.documentElement.clientHeight - heightValue[elementKey].value) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)

		if (isVisible && element !== undefined && elementKey !== undefined) seenElements.add(elementKey)

		return isVisible
	}

	function createAnimation(elements, elementKeys, startingHeight, startCallback, resetCallback) {
		elements.forEach((element, index) => {
			const elementKey = elementKeys[index]

			if (!element) {
				console.error(`${element} not found`)
				return
			}

			visibleOnLoad(element, elementKey, startingHeight, startCallback)

			document.addEventListener('scroll', () => {
				handlePageChangeOnScroll(element, elementKey, startingHeight, startCallback)
			})

			document.addEventListener('click', event => {
				handlePageChangeOnClick(event, element, elementKey, startingHeight, startCallback, resetCallback)
			})

			logo.addEventListener('click', event => {
				handlePageChangeOnClick(event, element, elementKey, startingHeight, startCallback, resetCallback)
			})
		})
	}

	function handleAnimationOnScroll(elements, classList, elementKeys, startCallback, removeCallback) {
		const checkScrollAnimation = () => {
			if (!isScrollAnimation) {
				elements.forEach((element, index) => {
					const className = Array.isArray(classList) ? classList[index] : classList

					if (element.classList.contains(className)) {
						if (handleVisibilityChange(element, 0, elementKeys)) {
							removeCallback(element, index)
						} else {
							element.style.transition = 'all 0.6s ease-out'
							startCallback(element, index)
						}
					}
				})
			} else {
				elements.forEach((element, index) => {
					removeCallback(element, index)
					element.removeAttribute('style')
				})
			}
		}

		document.addEventListener('scroll', checkScrollAnimation)

		checkScrollAnimation()
	}

	function writeAndResetText(elements, englishTexts, russianTexts, typeSpeed, elementKeys, className, delay) {
		const configs = elements.map((element, index) => ({
			element,
			targetString: englishTexts[index],
			letterIndex: 0,
			timeout: null,
			elementKey: elementKeys[index],
		}))

		const writeText = {}

		function handleLanguageChange() {
			configs.forEach((config, index) => {
				if (isLanguageRussian) setRussianText(config, russianTexts[index], className)
				if (!isLanguageRussian) setEnglishText(config, englishTexts[index], className)
			})
		}

		function setRussianText(config, russianText, className) {
			if (!russianText) return
			config.targetString = russianText

			config.element.classList.add('russian-font')
			if (className) config.element.classList.add(className)

			if (seenElements.has(config.elementKey)) {
				reset(config)
				write(config)
			}
		}

		function setEnglishText(config, englishText, className) {
			if (!englishText) return
			config.targetString = englishText

			config.element.classList.remove('russian-font')
			if (className) config.element.classList.remove(className)

			if (seenElements.has(config.elementKey)) {
				reset(config)
				write(config)
			}
		}

		function write(config) {
			config.element.textContent = config.targetString.substring(0, config.letterIndex)

			if (config.letterIndex < config.targetString.length) {
				config.timeout = setTimeout(() => {
					config.letterIndex++
					write(config)
				}, typeSpeed)
			}
		}

		function reset(config) {
			config.letterIndex = 0
			clearTimeout(config.timeout)
			config.element.textContent = ''
		}

		changeLanguageButton.addEventListener('click', handleLanguageChange)

		return {
			writeAll() {
				configs.forEach((config, index) => {
					if (seenElements.has(config.elementKey)) {
						if (!writeText[index]) {
							writeText[index] = { isWrited: false }
						}

						if (!writeText[index].isWrited) {
							writeText[index].isWrited = true

							reset(config)

							if (delay) {
								config.timeout = setTimeout(() => {
									write(config)
								}, index * delay)
							} else {
								write(config)
							}
						}
					}
				})
			},
			resetAll() {
				configs.forEach((config, index) => {
					if (writeText[index]?.isWrited) {
						writeText[index].isWrited = false
					}

					if (config[index]?.timeout) {
						clearTimeout(config[index].timeout)
					}

					reset(config)
				})
			},
		}
	}

	function sameElementsAnimation(queryElemetns, setIds, classes, startHeight, delay) {
		if (!queryElemetns) {
			console.error(`${queryElemetns} not found`)
			return
		}

		const elements = document.querySelectorAll(queryElemetns)

		const ids = []
		const elementKeys = []
		const startingHeight = startHeight

		const isAnimation = {}
		const visibleIndexes = []

		elements.forEach((element, index) => {
			const setId = `${setIds}-${index}`
			element.setAttribute('id', setId)

			const id = document.getElementById(`${setIds}-${index}`)
			ids.push(id)

			elementKeys.push(`${setIds}-${index}`)
		})

		function animate() {
			elements.forEach((element, index) => {
				if (seenElements.has(elementKeys[index])) {
					if (!isAnimation[index]) {
						isAnimation[index] = { animated: false, timeout: null }
					}

					if (!isAnimation[index].animated) {
						isAnimation[index].animated = true

						if (delay) {
							visibleIndexes.push(index)

							const indexDelay = visibleIndexes.indexOf(index) * delay

							isAnimation[index].timeout = setTimeout(() => {
								element.classList.add(...classes)
							}, indexDelay)
						} else {
							element.classList.add(...classes)
						}
					}
				}
			})
		}

		function reset() {
			elements.forEach((element, index) => {
				if (isAnimation[index]?.animated) {
					isAnimation[index].animated = false
				}

				element.classList.remove(...classes)
			})
		}

		createAnimation(ids, elementKeys, startingHeight, animate, reset)
	}

	function singleElementsAnimation(id, startingHeight, classNames, containerId) {
		if (!id) {
			console.error(`${id} not found`)
			return
		}

		const container = document.getElementById(containerId)
		const element = document.getElementById(id)

		const ids = [element]
		const elementKey = [id, containerId]
		const startHeight = startingHeight

		if (containerId) ids.push(container)

		function animate() {
			element.classList.add(...classNames)
		}

		function reset() {
			element.classList.remove(...classNames)
		}

		createAnimation(ids, elementKey, startHeight, animate, reset)
	}

	function addId(elements, id, startHeight) {
		const ids = []
		const elementKeys = []
		const startingHeight = startHeight

		elements.forEach((element, index) => {
			const setId = `${id}-${index}`
			element.setAttribute('id', setId)

			const addId = document.getElementById(setId)
			elementKeys.push(`${id}-${index}`)

			ids.push(addId)
		})

		return {
			ids,
			elementKeys,
			startingHeight,
		}
	}

	function manageClasses(elements, classNames, singleElementSelector) {
		if (elements && elements.length) {
			elements.forEach(element => {
				element.classList[isLanguageRussian ? 'add' : 'remove'](...classNames)
			})
		}

		if (singleElementSelector) {
			const el = document.querySelector(singleElementSelector)

			if (el) el.classList[isLanguageRussian ? 'add' : 'remove'](...classNames)
		}
	}

	function translateText(language, ruClassName) {
		const elements = document.querySelectorAll('[data-ru][data-en]')

		elements.forEach(element => {
			const text = element.dataset[language]
			if (text) element.textContent = text

			element.classList[language === 'ru' ? 'add' : 'remove'](ruClassName)
		})
	}

	function scrollLine() {
		const lines = document.querySelectorAll('.scroll-section__line')

		const setIds = addId(lines, 'scroll-section-line', 40)

		const isAnimation = {}

		function animate() {
			lines.forEach((line, index) => {
				if (seenElements.has(setIds.elementKeys[index])) {
					if (!isAnimation[index]) {
						isAnimation[index] = { animate: false }
					}

					if (!isAnimation[index].animate) {
						isAnimation[index].animate = true

						line.classList.add('scroll-section__line--animate')
					}
				}
			})
		}

		function reset() {
			lines.forEach((line, index) => {
				if (isAnimation[index]?.animate) {
					isAnimation[index].animate = false
				}

				line.classList.remove('scroll-section__line--animate')
			})
		}

		createAnimation(setIds.ids, setIds.elementKeys, setIds.startingHeight, animate, reset)
	}

	function handleChangeOrintationAddClasses() {
		const animateElements = document.querySelectorAll("[class*='animate']")

		animateElements.forEach(el => {
			el.classList.forEach(className => {
				if (className.includes('animate')) {
					el.classList.add(className)
				}
			})
		})
	}

	function pageUpdate() {
		window.scrollTo(0, 0)
	}

	function switchPages() {
		const pages = document.querySelectorAll('.page')
		const buttons = document.querySelectorAll('.nav__btn')

		const buttonLines = [
			{ element: 'nav__hover-top-line', position: 'top' },
			{ element: 'nav__hover-center-line', position: 'center' },
			{ element: 'nav__hover-bottom-line', position: 'bottom' },
		]

		function handleBtnClick(event) {
			const target = event.target.closest('.nav__btn')

			if (target) {
				const pageId = `page-${target.dataset.page}`
				const activePage = document.getElementById(pageId)

				pages.forEach(page => {
					page.classList.remove('page--active')
				})

				if (activePage) {
					activePage.classList.add('page--active')
				}

				window.scrollTo(0, 0)

				buttons.forEach(button => {
					button.classList.remove('nav__btn--clicked')
					buttonLines.forEach(({ element, position }) => {
						const lineElement = button.querySelector(`.${element}`)
						if (lineElement) {
							lineElement.classList.remove(`nav__hover-${position}-line--clicked`)
						}
					})
				})

				target.classList.add('nav__btn--clicked')
				buttonLines.forEach(({ element, position }) => {
					const currentLineElement = target.querySelector(`.${element}`)
					if (currentLineElement) {
						currentLineElement.classList.add(`nav__hover-${position}-line--clicked`)
					}
				})
			}
		}

		document.addEventListener('click', handleBtnClick)

		function handleLogoClick() {
			pages.forEach(page => {
				page.classList.remove('page--active')
			})

			buttons.forEach(button => {
				button.classList.remove('nav__btn--clicked')
				buttonLines.forEach(({ element, position }) => {
					const lineElement = button.querySelector(`.${element}`)
					if (lineElement) {
						lineElement.classList.remove(`nav__hover-${position}-line--clicked`)
					}
				})
			})

			buttonLines.forEach(({ element, position }) => {
				const currentLineElement = document.querySelector(`.${element}`)

				if (currentLineElement) {
					currentLineElement.classList.add(`nav__hover-${position}-line--clicked`)
				}
			})

			homePageBtn.classList.add('nav__btn--clicked')
			homePage.classList.add('page--active')

			window.scrollTo(0, 0)
		}

		logo.addEventListener('click', handleLogoClick)
	}

	function climbUp() {
		const button = document.getElementById('climb-up')
		const img = document.getElementById('climb-img')
		const circle = document.getElementById('climb-circle')

		let animationFrameTop = null
		let animationFrameScroll = null
		let isScrolling = false
		let isUserScrolling = false

		const config = {
			scrollSpeed: 20,
			btnVisible: 400,
		}

		function toggleClasses(element, addClasses, removeClasses) {
			element.classList.add(...addClasses)
			element.classList.remove(...removeClasses)
		}

		function handleUserScrollEndAnimation() {
			isUserScrolling = false
			cancelAnimationFrame(animationFrameTop)
			animationFrameTop = null
		}

		function scrollToTop() {
			if (!isUserScrolling) return

			const scrollStep = window.scrollY / config.scrollSpeed

			if (window.scrollY > 0) {
				window.scrollBy(0, -scrollStep)
				animationFrameTop = requestAnimationFrame(scrollToTop)
			} else {
				cancelAnimationFrame(animationFrameTop)
			}
		}

		function handleScroll() {
			const scrollY = window.scrollY

			const set = new Set()
			const animations = ['climb-up-img-hide', 'climb-up-circle-hide']

			function handleAnimationEnd(event) {
				if (animations.includes(event.animationName)) {
					set.add(event.animationName)

					if (set.size === animations.length) {
						button.classList.add('climb-up--hidden')

						set.clear()
					}
				}
			}

			if (scrollY >= config.btnVisible) {
				toggleClasses(button, ['climb-up--show'], ['climb-up--hidden'])
				toggleClasses(img, ['climb-up__img--animate-show'], ['climb-up__img--animate-hide'])
				toggleClasses(circle, ['climb-up__circle--show'], ['climb-up__circle--hide'])

				if (!button.hasEventListener) {
					button.addEventListener('click', () => {
						isUserScrolling = true
						scrollToTop()
					})
					button.hasEventListener = true
				}

				document.removeEventListener('animationend', handleAnimationEnd)
			} else {
				toggleClasses(img, ['climb-up__img--animate-hide'], ['climb-up__img--animate-show'])
				toggleClasses(circle, ['climb-up__circle--hide'], ['climb-up__circle--show'])
				button.classList.remove('climb-up--show')

				document.addEventListener('animationend', handleAnimationEnd)
			}

			if (scrollY < config.btnVisible && !animationFrameScroll) {
				animationFrameScroll = requestAnimationFrame(handleScroll)
			} else {
				cancelAnimationFrame(animationFrameScroll)
			}

			isScrolling = false
		}

		window.addEventListener('wheel', handleUserScrollEndAnimation)
		window.addEventListener('touchstart', handleUserScrollEndAnimation)

		window.addEventListener('scroll', () => {
			if (!isScrolling) {
				isScrolling = true
				requestAnimationFrame(handleScroll)
			}
		})
	}

	function asideMenu() {
		const menuElement = document.getElementById('aside-menu')
		const openBtn = document.getElementById('aside-menu-btn')
		const closeBtn = document.getElementById('aside-menu-close')
		const activeBtn = document.getElementById('aside-menu-acitve')

		const animationToggleStateBtn = document.getElementById('animation-toggle-stop')
		const animationScrollBtn = document.getElementById('animation-scroll-stop')

		const stateBtns = [animationToggleStateBtn, animationScrollBtn]

		function changeAnimationState() {
			function updateAnimationText() {
				const toggleAnimationText = isLanguageRussian ? 'Анимации' : 'Animations'
				const onOffToggleText = isLanguageRussian ? (isAnimationStopped ? 'ВЫКЛ' : 'ВКЛ') : isAnimationStopped ? 'OFF' : 'ON'

				animationToggleStateBtn.textContent = isAnimationStopped ? `Re:${toggleAnimationText}: ${onOffToggleText}` : `Re:${toggleAnimationText}: ${onOffToggleText}`

				stateBtns.forEach(btn => {
					btn.classList.toggle('new-font', isLanguageRussian)
				})
			}

			updateAnimationText()

			function toggleAnimationState(variable) {
				if (variable === 'isLanguageRussian') isLanguageRussian = !isLanguageRussian
				if (variable === 'isAnimationStopped') isAnimationStopped = !isAnimationStopped
				updateAnimationText()
			}

			animationScrollBtn.addEventListener('click', () => toggleAnimationState('isScrollAnimation'))
		}

		changeAnimationState()

		function backgroundColorChange() {
			const root = document.querySelector('.page')
			const buttons = document.querySelectorAll('.aside-colors__colors')
			const classes = ['bg-color--1', 'bg-color--2', 'bg-color--3', 'bg-color--4']

			let isTransitioning = false
			let currentClass = 'bg-color--1'

			function changeGradient(className) {
				if (isTransitioning || currentClass === className) return

				isTransitioning = true
				currentClass = className

				let transitionPoint = 30

				function updateTransitionPoint() {
					transitionPoint++
					root.style.setProperty('--gradient-transition-point', `${transitionPoint}%`)

					if (transitionPoint < 100) {
						requestAnimationFrame(updateTransitionPoint)
					} else {
						root.classList.remove(...classes)
						root.classList.add(className)

						let returnPoint = 100

						function returnTransitionPoint() {
							returnPoint--
							root.style.setProperty('--gradient-transition-point', `${returnPoint}%`)

							if (returnPoint > 30) {
								requestAnimationFrame(returnTransitionPoint)
							} else {
								isTransitioning = false
							}
						}

						requestAnimationFrame(returnTransitionPoint)
					}
				}

				requestAnimationFrame(updateTransitionPoint)
			}

			buttons.forEach((button, index) => {
				button.addEventListener('click', event => {
					const target = event.target

					if (!isTransitioning) {
						buttons.forEach(element => element.classList.remove('aside-colors__colors--active'))
						target.classList.add('aside-colors__colors--active')
					}

					const className = classes[index]
					changeGradient(className)
				})
			})
		}

		backgroundColorChange()

		function manageMenuAnimations() {
			const menuState = { isOpen: false, timeout: null }

			function openMenu() {
				if (menuState.isOpen) return

				menuState.isOpen = !menuState.isOpen
				clearTimeout(menuState.timeout)
				menuState.timeout = null

				menuElement.classList.remove('aside-menu__wrapper--close')
				menuElement.classList.add('aside-menu__wrapper--open')
				activeBtn.classList.add('aside-content__acite--open')
				closeBtn.classList.add('aside-content__btn--close')
				openBtn.classList.add('aside-menu__btn--close')

				document.querySelectorAll('.aside-content__item').forEach(element => {
					element.removeAttribute('style')
				})
			}

			function closeMenu() {
				if (!menuState.isOpen) return

				menuState.isOpen = !menuState.isOpen
				clearTimeout(menuState.timeout)
				menuState.timeout = null

				menuElement.classList.remove('aside-menu__wrapper--open')
				menuElement.classList.add('aside-menu__wrapper--close')
				closeBtn.classList.remove('aside-content__btn--close')

				document.querySelectorAll('.aside-content__item').forEach(element => {
					element.style.cssText = `
							pointer-events: none;
							width: 0;
							transition: all 0.2s ease;
						`

					menuState.timeout = setTimeout(() => {
						element.removeAttribute('style')
					}, 400)
				})

				activeBtn.classList.remove('aside-content__acite--open')
				openBtn.classList.remove('aside-menu__btn--close')
			}

			openBtn.addEventListener('click', openMenu)
			closeBtn.addEventListener('click', closeMenu)
		}

		manageMenuAnimations()

		function initializeMenu() {
			openBtn.classList.add('aside-menu__btn--start')
		}

		initializeMenu()

		function stopAnimationHover() {
			const triggerBtn = document.querySelector('.aside-content__btn--animation-stop')
			const animationBtns = document.querySelectorAll('.aside-animations__btn')

			if (!triggerBtn || animationBtns.length < 3) {
				console.error('Элементы не найдены или их недостаточно.')
				return
			}

			triggerBtn.addEventListener('mouseover', () => {
				animationBtns[0].style.cssText = `
					top: 0;
					transition: all 0.3s 0.4s ease-out;
				`

				animationBtns[2].style.cssText = `
					bottom: 0;
					transition: all 0.3s 0.4s ease-out;
				`
			})

			triggerBtn.addEventListener('mouseleave', () => {
				animationBtns.forEach(el => {
					el.removeAttribute('style')
				})
			})
		}

		stopAnimationHover()
	}

	function headerEvents() {
		function animateHeaderMain() {
			const container = document.getElementById('header-main')

			container.classList.add('header-main__wrapper--animate')
		}

		animateHeaderMain()

		function burgerMenu() {
			const elements = {
				menuContainer: document.getElementById('burger-menu'),
				navContainer: document.getElementById('header-nav-container'),
				navElement: document.getElementById('header-main-nav'),
				logoElement: document.getElementById('logo'),
				headerContainer: document.getElementById('header-main'),
				socialMediaContainer: document.getElementById('social-media'),
				socialMediaList: document.getElementById('social-media-list'),
				page: document.getElementById('page'),
			}

			const queryElements = {
				navItemElements: document.querySelectorAll('.nav__item'),
				socialMediaElements: document.querySelectorAll('.social-media__item'),
			}

			const burgerLines = [
				{ element: document.getElementById('burger-line-top'), position: 'top' },
				{ element: document.getElementById('burger-line-center'), position: 'center' },
				{ element: document.getElementById('burger-line-bottom'), position: 'bottom' },
			]

			let isOpen = false
			let isAnimating = false
			let timeouts = []

			function toggleLineClasses(action) {
				burgerLines.forEach(({ element, position }) => {
					element.classList[action](`burger-menu__line--${position}-animate`)
				})
			}

			function toggleNavItemClasses(action) {
				queryElements.navItemElements.forEach((element, index) => {
					const left = 'nav__item--left-animate'
					const right = 'nav__item--right-animate'
					const addClasses = index % 2 === 0 ? left : right

					if (action === 'add') element.classList.add(addClasses)
					if (action === 'remove') element.classList.remove(left, right)
				})
			}

			function togglesocialMediaClasses(action) {
				if (action === 'add') {
					queryElements.socialMediaElements.forEach((item, index) => {
						const timeout = setTimeout(() => {
							item.classList.add('social-media__item--burger-open')
						}, 100 * index)

						timeouts.push(timeout)
					})
				}

				if (action === 'remove') {
					queryElements.socialMediaElements.forEach(item => item.classList.remove('social-media__item--burger-open'))

					timeouts.forEach(clearTimeout)
					timeouts = []
				}
			}

			function toggleElements() {
				elements.menuContainer.classList.toggle('burger-menu--animate-open', isOpen)
				elements.menuContainer.classList.toggle('burger-menu--animate-close', !isOpen)
				elements.navContainer.classList.toggle('header-main__nav-container--burger-open-animate', isOpen)
				elements.navContainer.classList.toggle('header-main__nav-container--burger-close-animate', !isOpen)
				elements.logoElement.classList.toggle('logo--burger-open', isOpen)
				elements.headerContainer.classList.toggle('header-main__wrapper--burger-open', isOpen)
				elements.socialMediaContainer.classList.toggle('social-media--burger-open')
				elements.socialMediaList.classList.remove('social-media__list--burger-open')
				elements.page.classList.add('page--burger-open')
			}

			function removeElements() {
				elements.menuContainer.classList.remove('burger-menu--animate-open', 'burger-menu--animate-close', 'burger-menu--open')
				elements.navContainer.classList.remove('header-main__nav-container--burger-open', 'header-main__nav-container--burger-open-animate', 'header-main__nav-container--burger-close-animate')
				elements.navElement.classList.remove('header-main__nav--burger-open')
				elements.logoElement.classList.remove('logo--burger-open')
				elements.headerContainer.classList.remove('header-main__wrapper--burger-open')
				elements.socialMediaContainer.classList.remove('social-media--burger-open')
				elements.page.classList.remove('page--burger-open')
			}

			function handleAnimationEnd(event) {
				const { animationName } = event

				if (animationName === 'burger-menu-close') {
					toggleLineClasses('remove')

					elements.menuContainer.classList.remove('burger-menu--animate-close', 'burger-menu--open')
				}

				if (animationName === 'burger-menu-open') {
					elements.menuContainer.classList.remove('burger-menu--animate-open')
					elements.menuContainer.classList.add('burger-menu--open')
				}

				if (animationName === 'nav-container-burger-open') {
					elements.navContainer.classList.remove('header-main__nav-container--burger-open-animate')
					elements.navContainer.classList.add('header-main__nav-container--burger-open')
					elements.navElement.classList.add('header-main__nav--burger-open')
					elements.socialMediaContainer.classList.add('social-media--burger-open')
					elements.socialMediaList.classList.add('social-media__list--burger-open')

					toggleNavItemClasses('add')
					togglesocialMediaClasses('add')
				}

				if (animationName === 'nav-container-burger-close') {
					elements.page.classList.remove('page--burger-open')
					elements.navContainer.classList.remove('header-main__nav-container--burger-open', 'header-main__nav-container--burger-close-animate')
					elements.navElement.classList.remove('header-main__nav--burger-open')
					elements.socialMediaContainer.classList.remove('social-media--burger-open')
					elements.socialMediaList.classList.remove('social-media__list--burger-open')

					toggleNavItemClasses('remove')
				}

				if (['nav-container-burger-open', 'nav-container-burger-close'].includes(animationName)) {
					setTimeout(() => {
						isAnimating = false
					}, 1000)
				}
			}

			function toggleMenu() {
				if (isAnimating) return

				isOpen = !isOpen
				isAnimating = true

				toggleLineClasses('add')
				togglesocialMediaClasses('remove')
				toggleElements()

				document.addEventListener('animationend', handleAnimationEnd)
			}

			elements.menuContainer.addEventListener('click', toggleMenu)

			function resetMenuClasses() {
				toggleLineClasses('remove')
				toggleNavItemClasses('remove')
				removeElements()

				isOpen = false
				isAnimating = false
			}

			function handleResetOnResize() {
				if (window.innerWidth > 1000) {
					resetMenuClasses()
				}
			}

			window.addEventListener('resize', handleResetOnResize)
		}

		burgerMenu()
	}

	function homePageEvents() {
		singleElementsAnimation('hmp-getting-title', 0, ['hmp-getting__title--animate'], 'hmp-getting-hidden-title')

		function updateSkillsText() {
			const container = document.getElementById('hmp-getting-group-text')
			const text = document.getElementById('hmp-getting-text')
			const blink = document.getElementById('hmp-getting-blink')

			const ids = [container]
			const elementKeys = ['hmp-getting-group-text']
			const startHeight = 0

			const texts = {
				en: [
					`I'm frontend developer`,
					'I want to learn a lot. . .',
					'HTML is easy!',
					'Javascript is my choice!',
					'I love CSS animations!',
					'Making magic in the browser!',
					'Programming reality in JS',
					'Frontend is my superpower!',
					'Code and get inspired!',
					'Coming soon... React!',
				],
				ru: [
					'Я фронтенд разработчик',
					'Я хочу многому научиться. . .',
					'HTML — это просто!',
					'JavaScript — мой выбор!',
					'Обожаю CSS-анимации!',
					'Создаю магию в браузере!',
					'Программирую реальность на JS',
					'Фронтенд — это моя суперсила!',
					'Кодить и вдохновляться!',
					'Скоро. . . React!',
				],
			}

			let textIndex = 0
			let letterIndex = 0
			let isDeleted = false
			let blinkHasAnimated = false
			let textTyping = false
			let timeout = null
			let isReseted = false

			const cfg = {
				typeSpeed: 70,
				deleteSpeed: 50,
				startWrite: 800,
				nextString: 2200,
				delayWriteNextString: 1700,
			}

			let tempLanguageState = null

			function startTyping() {
				let currentText = tempLanguageState ? texts.ru[textIndex] : texts.en[textIndex]
				text.textContent = currentText.substring(0, letterIndex)

				clearTimeout(timeout)

				if (!isDeleted && letterIndex < currentText.length) {
					if (!textTyping) {
						tempLanguageState = isLanguageRussian
						text.classList.toggle('russian-font', tempLanguageState)
						text.classList.toggle('hmp-getting__text--rus-lang', tempLanguageState)
					}
					textTyping = true
					letterIndex++
					timeout = setTimeout(startTyping, cfg.typeSpeed)
				} else if (isDeleted && letterIndex > 0) {
					letterIndex--
					timeout = setTimeout(startTyping, cfg.deleteSpeed)
				} else if (!isDeleted && letterIndex === currentText.length) {
					textTyping = false
					isDeleted = true
					timeout = setTimeout(startTyping, cfg.nextString)
				} else if (isDeleted && letterIndex === 0) {
					isDeleted = false
					timeout = setTimeout(startTyping, cfg.delayWriteNextString)
					textIndex = (textIndex + 1) % (isLanguageRussian ? texts.ru.length : texts.en.length)
				}
			}

			function handleBlinkAnimation(event) {
				if (event.animationName === 'hmp-getting-blink-start' && !blinkHasAnimated) {
					blinkHasAnimated = true
					timeout = setTimeout(startTyping, cfg.startWrite)
				}
			}

			function animate() {
				isReseted = false

				blink.classList.add('hmp-getting__blink--animate')
				document.addEventListener('animationend', handleBlinkAnimation)
			}

			function reset() {
				if (isReseted) return
				isReseted = true

				blink.classList.remove('hmp-getting__blink--animate')

				isDeleted = false
				blinkHasAnimated = false
				clearTimeout(timeout)
				text.textContent = ''
				textIndex = (textIndex + 1) % (isLanguageRussian ? texts.ru.length : texts.en.length)

				letterIndex = 0

				document.removeEventListener('animationend', handleBlinkAnimation)
			}

			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		updateSkillsText()

		function animateLogo3d() {
			const container = document.getElementById('hmp-getting-inner-logo-3d')
			const preverve = document.getElementById('hmp-getting-preverve')
			const front = document.getElementById('hmp-getting-front')
			const lineTop = document.getElementById('hmp-getting-line-top')
			const lineLeft = document.getElementById('hmp-getting-line-left')
			const lineRigth = document.getElementById('hmp-getting-line-right')
			const lineBottom = document.getElementById('hmp-getting-line-bottom')
			const shadow = document.getElementById('hmp-getting-shadow')
			const img = document.getElementById('hmp-getting-img')

			const ids = [container]
			const elementKeys = ['hmp-getting-inner-logo-3d']
			const startHeight = 0

			const elements = [container, preverve, front, lineTop, lineRigth, lineLeft, lineBottom, shadow, img]

			let isLineAnimated = false
			let isFontAnimated = false

			const lineAnimations = ['hmp-getting-logo-3d-line-left', 'hmp-getting-logo-3d-line-right', 'hmp-getting-logo-3d-line-top', 'hmp-getting-logo-3d-line-bottom']
			const mainAnimations = ['hmp-getting-logo-3d-front-start', 'hmp-getting-logo-3d-img-start']

			const completedLineAnimations = new Set()
			const completedMainAnimations = new Set()

			function handleLineAnimations(event) {
				if (lineAnimations.includes(event.animationName)) {
					completedLineAnimations.add(event.animationName)

					if (completedLineAnimations.size === lineAnimations.length) {
						if (isLineAnimated) return
						isLineAnimated = true

						front.classList.add('hmp-getting__front--animate')
						shadow.classList.add('hmp-getting__shadow--animate')
						img.classList.add('hmp-getting__img--animate')

						completedLineAnimations.clear()
					}
				}
			}

			function handleMainAnimations(event) {
				if (mainAnimations.includes(event.animationName)) {
					completedMainAnimations.add(event.animationName)

					if (completedMainAnimations.size === mainAnimations.length) {
						if (isFontAnimated) return
						isFontAnimated = true

						preverve.classList.add('hmp-getting__preserve-3d--animate')

						completedMainAnimations.clear()
					}
				}
			}

			function animate() {
				lineLeft.classList.add('hmp-getting__line-left--animate')
				lineRigth.classList.add('hmp-getting__line-right--animate')
				lineTop.classList.add('hmp-getting__linte-top--animate')
				lineBottom.classList.add('hmp-getting__line-bottom--animate')

				document.addEventListener('animationend', handleLineAnimations)
				document.addEventListener('animationend', handleMainAnimations)
			}

			function reset() {
				isFontAnimated = false
				isLineAnimated = false

				elements.forEach(element => {
					const classList = Array.from(element.classList)

					classList.forEach(className => {
						if (className.includes('--animate')) {
							element.classList.remove(className)
						}
					})
				})

				document.removeEventListener('animationend', handleLineAnimations)
				document.removeEventListener('animationend', handleMainAnimations)
			}

			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		animateLogo3d()

		function scrollTextAnimate() {
			const container = document.getElementById('hmp-scroll-text')
			const left = document.querySelectorAll('.hmp-scroll__letter-left')
			const right = document.querySelectorAll('.hmp-scroll__letter-right')

			const ids = [container]
			const elementKeys = ['hmp-scroll-text']
			const startHeight = 40

			const timeouts = []

			function animate() {
				for (let index = left.length - 1; index >= 0; index--) {
					const timeout = setTimeout(
						() => {
							left[index].classList.add('hmp-scroll__letter-left--animate')
						},
						(left.length - 1 - index) * 150
					)

					timeouts.push(timeout)
				}

				right.forEach((element, index) => {
					const timeout = setTimeout(() => {
						element.classList.add('hmp-scroll__letter-right--animate')
					}, index * 150)

					timeouts.push(timeout)
				})
			}

			function reset() {
				left.forEach(element => element.classList.remove('hmp-scroll__letter-left--animate'))
				right.forEach(element => element.classList.remove('hmp-scroll__letter-right--animate'))
				timeouts.forEach(timeout => clearTimeout(timeout))
			}

			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		scrollTextAnimate()

		function animateCards() {
			const configProgress = [
				{ id: 0, className: 'html', precent: 70, progressDuration: 6000, precentChangeTime: 2000 },
				{ id: 1, className: 'css', precent: 80, progressDuration: 7500, precentChangeTime: 2200 },
				{ id: 2, className: 'js', precent: 40, progressDuration: 4000, precentChangeTime: 2400 },
				{ id: 3, className: 'react', precent: 10, progressDuration: 2000, precentChangeTime: 2600 },
			]

			const conteiners = document.querySelectorAll('.hmp-cards__container')
			const svgBoxes = document.querySelectorAll('.hmp-cards__svg-box')
			const texts = document.querySelectorAll('.hmp-cards__progress-text')
			const values = document.querySelectorAll('.hmp-cards__value')
			const textBoxes = document.querySelectorAll('.hmp-cards__inner-text')
			const textsElements = document.querySelectorAll('.hmp-cards__text')
			const progressBoxes = document.querySelectorAll('.hmp-cards__inner-progress')

			function animateProgress() {
				const ids = []
				const elementKeys = []
				const startHeight = 30

				const circles = []
				const intervals = []
				const animationFrames = []
				const timeouts = []
				const visibleIndexes = []
				const animationEnd = {}
				const fluctuateStatus = {}

				let handleAnimation = null

				conteiners.forEach((_, index) => {
					progressBoxes[index].setAttribute('id', `hmp-cards-inner-progress-${index}`)
					values[index].setAttribute('id', `hmp-cards-value-${index}`)

					const id = document.getElementById(`hmp-cards-inner-progress-${index}`)
					const circle = document.getElementById(`hmp-cards-circle-${index}`)

					elementKeys.push(`cards-inner-progress-${index}`)
					ids.push(id)
					circles.push(circle)
				})

				function getPrecentCards(circleId, numberId, elementKey, targetPercent, duration, precentChangeTime) {
					const progressCircle = document.getElementById(circleId)
					const percentValue = document.getElementById(numberId)
					const radius = progressCircle.r.baseVal.value
					const circumference = 2 * Math.PI * radius
					const initialOffset = circumference * 0.99

					let intervalFluctuateProgress = null

					if (!fluctuateStatus[elementKeys]) {
						fluctuateStatus[elementKey] = { isStart: false }
					}

					progressCircle.style.strokeDasharray = `${circumference}`
					progressCircle.style.strokeDashoffset = `${initialOffset}`

					function setProgress(percent) {
						const offset = circumference - (percent / 100) * circumference
						progressCircle.style.strokeDashoffset = offset
						percentValue.textContent = `${percent}`
					}

					function animateProgress() {
						let start = null
						let initialPercent = 0

						function step(timestamp) {
							if (!start) start = timestamp
							const progress = timestamp - start
							const percent = Math.min(initialPercent + (progress / duration) * targetPercent, targetPercent)
							setProgress(Math.floor(percent))

							if (progress < duration) {
								const animationFrame = requestAnimationFrame(step)
								animationFrames.push(animationFrame)
							} else if (!fluctuateStatus[elementKey].isStart) {
								fluctuateStatus[elementKey].isStart = true

								fluctuateProgress()
							}
						}

						const animationFrame = requestAnimationFrame(step)
						animationFrames.push(animationFrame)
					}

					setProgress(0)
					animateProgress()

					function fluctuateProgress() {
						if (intervalFluctuateProgress) return

						intervalFluctuateProgress = setInterval(() => {
							const currentPercent = parseInt(percentValue.textContent, 10)
							const fluctuation = Math.floor(Math.random() * 3) - 1
							let newPercent = currentPercent + fluctuation

							if (newPercent <= 0) {
								newPercent = 0
							} else if (newPercent >= 100) {
								newPercent = 100
							}

							if (newPercent > targetPercent + 5 && targetPercent >= 0) {
								newPercent = targetPercent + 5
							} else if (newPercent < targetPercent - 5 && targetPercent >= 0) {
								newPercent = targetPercent - 5
							}

							if (precentChangeTime != 0) {
								setProgress(newPercent)
							}
						}, precentChangeTime)

						intervals.push(intervalFluctuateProgress)
					}
				}

				function animate() {
					svgBoxes.forEach((_, index) => {
						if (!animationEnd[index]) {
							animationEnd[index] = { isEnded: false, isStarted: false }
						}

						if (seenElements.has(elementKeys[index])) {
							if (!animationEnd[index].isStarted) {
								animationEnd[index].isStarted = true

								const { id, className, precent, progressDuration, precentChangeTime } = configProgress[index]

								const svgBox = svgBoxes[index]
								const progressText = texts[index]
								const container = conteiners[index]
								const progressBox = progressBoxes[index]

								progressBox.classList.add('hmp-cards__inner-progress--animate')

								visibleIndexes.push(index)

								setTimeout(() => {
									visibleIndexes.length = 0
								}, 100)

								const delay = visibleIndexes.indexOf(index) * 100

								const timeout = setTimeout(() => {
									svgBox.classList.add('hmp-cards__svg-box--animate')
									progressText.classList.add('hmp-cards__progress-text--animate')
									container.classList.add(`hmp-cards__container--${className}-animate`)
								}, delay)

								timeouts.push(timeout)

								handleAnimation = event => {
									if (event.target === svgBoxes[index] && event.animationName === 'hmp-cards-svg-box' && !animationEnd[index].isEnded) {
										animationEnd[index].isEnded = true

										getPrecentCards(`hmp-cards-circle-${id}`, `hmp-cards-value-${id}`, `hmp-cards-progress-${id}`, precent, progressDuration, precentChangeTime)

										const timeout = setTimeout(() => {
											circles[index].classList.add(`hmp-cards__circle--${className}`)
										}, 100)

										timeouts.push(timeout)
									}
								}

								document.addEventListener('animationend', handleAnimation)
							}
						}
					})
				}

				function reset() {
					svgBoxes.forEach((_, index) => {
						const { className } = configProgress[index]

						animationEnd[index] = { isEnded: false, isStarted: false }
						fluctuateStatus[index] = { isStart: false }

						conteiners[index].classList.remove(`hmp-cards__container--${className}-animate`)
						svgBoxes[index].classList.remove('hmp-cards__svg-box--animate')
						texts[index].classList.remove('hmp-cards__progress-text--animate')

						circles[index].classList.remove(`hmp-cards__circle--${className}`)

						values[index].textContent = 0
						clearInterval(intervals[index])
					})

					animationFrames.forEach(frame => cancelAnimationFrame(frame))

					animationFrames.length = 0
					intervals.length = 0
				}

				createAnimation(ids, elementKeys, startHeight, animate, reset)
			}

			animateProgress()

			function animateTexts() {
				const ids = []
				const elementKeys = []
				let startHeight = document.documentElement.clientWidth < 1030 ? 30 : 215

				textsElements.forEach((element, index) => {
					const id = `hmp-cards-text-${index}`
					element.setAttribute('id', id)

					elementKeys.push(`hmp-cards-text-${index}`)
					ids.push(element)
				})

				conteiners.forEach((_, index) => {
					const { className } = configProgress[index]
					const textElements = [...textBoxes[index].childNodes].filter(node => node.nodeType === 1 && node.classList.contains('hmp-cards__text'))

					textElements.forEach((element, index) => {
						if (index % 2 === 0) {
							element.classList.add(`hmp-cards__text--${className}`)
						}
					})
				})

				const timeouts = []
				const visibleIndexes = []
				const animationEnd = {}

				function updateStartingHeight() {
					startHeight = document.documentElement.clientWidth < 1030 ? 50 : 215
				}

				function animate() {
					window.addEventListener('resize', updateStartingHeight)

					textsElements.forEach((element, index) => {
						if (!animationEnd[index]) {
							animationEnd[index] = { isStarted: false }
						}

						if (seenElements.has(elementKeys[index])) {
							if (!animationEnd[index].isStarted) {
								animationEnd[index].isStarted = true

								visibleIndexes.push(index)

								setTimeout(() => {
									visibleIndexes.length = 0
								}, 80)

								const delay = visibleIndexes.indexOf(index) * 80

								const timeout = setTimeout(() => {
									element.classList.add('hmp-cards__text--animate')
								}, delay)

								timeouts.push(timeout)
							}
						}
					})
				}

				function reset() {
					window.removeEventListener('resize', updateStartingHeight)

					textsElements.forEach((element, index) => {
						element.classList.remove('hmp-cards__text--animate')

						clearTimeout(timeouts[index])

						animationEnd[index] = { isStarted: false }
					})

					timeouts.length = 0
				}

				createAnimation(ids, elementKeys, startHeight, animate, reset)
			}

			animateTexts()
		}

		animateCards()

		function animateProjectsText() {
			const text_1 = document.getElementById('projects-text-one')
			const text_2 = document.getElementById('projects-text-two')
			const innerText = document.getElementById('projects-inner-text')

			const ids = [innerText]
			const scollIds = [text_1, text_2]
			const scrollKeys = ['projects-text-one', 'projects-text-two']
			const classNames = ['projects__text-one--animate', 'projects__text-two--animate']
			const elementKeys = ['projects-inner-text']
			const startHeight = 50

			function animate() {
				text_1.classList.add('projects__text-one--animate')
				text_2.classList.add('projects__text-two--animate')
			}

			function reset() {
				text_1.classList.remove('projects__text-one--animate')
				text_2.classList.remove('projects__text-two--animate')
			}

			function scrollAnimate() {
				text_1.classList.add('projects__text--one-scroll-animate')
				text_2.classList.add('projects__text--two-scroll-animate')
			}

			function scrollReset() {
				text_1.classList.remove('projects__text--one-scroll-animate')
				text_2.classList.remove('projects__text--two-scroll-animate')
			}

			handleAnimationOnScroll(scollIds, classNames, scrollKeys, scrollAnimate, scrollReset)
			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		animateProjectsText()

		function animateCloud() {
			const cloud = document.getElementById('cloud-particle-center')
			const cloudContainer = document.getElementById('cloud-container')
			const cloudTop = document.getElementById('cloud-partilce-top')
			const cloudBottom = document.getElementById('cloud-bottom')

			const drops = cloud.querySelectorAll('.cloud__drop')

			const ids = [cloudContainer]
			const elementKeys = ['cloud-container']
			let startHeight = document.documentElement.clientWidth > 1100 ? 130 : 200

			let timeout = null
			let interval = null
			let isCloudVisible = false

			function handleChangeOnResize() {
				startHeight = document.documentElement.clientWidth > 1100 ? 130 : 200
			}

			function handleAnimationEnd(event) {
				const { animationName } = event

				if (animationName === 'cloud-partilce-center-start') {
					cloudContainer.classList.add('cloud--animate')
				}

				if (animationName === 'cloud-container-visible') {
					cloudTop.classList.add('cloud__particle-top--animate')
					cloudBottom.classList.add('cloud__bottom--animate')

					interval = setInterval(() => {
						if (!isCloudVisible) {
							rain()
						}
					}, 50)
				}
			}

			function rain() {
				const elements = document.createElement('div')
				const position = Math.floor(Math.random() * (cloud.offsetWidth - 50) + 25)
				const width = Math.random() * 5
				const height = Math.random() * 50
				const duration = Math.random() * 0.5

				elements.classList.add('cloud__drop')
				cloud.appendChild(elements)
				elements.style.left = `${position}px`
				elements.style.width = `${0.5 * width}px`
				elements.style.height = `${0.5 * height}px`
				elements.style.animationDuration = `${1.5 + duration}s`

				timeout = setTimeout(() => {
					if (cloud.contains(elements)) {
						cloud.removeChild(elements)
					}
				}, 2000)
			}

			function animate() {
				cloud.classList.add('cloud__particle-center--animate')

				document.addEventListener('animationend', handleAnimationEnd)
				window.addEventListener('resize', handleChangeOnResize)
			}

			function reset() {
				clearInterval(interval)
				clearTimeout(timeout)

				isCloudVisible = false

				drops.forEach(drop => {
					if (cloud.contains(drop)) {
						cloud.removeChild(drop)
					}
				})

				cloud.classList.remove('cloud__particle-center--animate')
				cloudContainer.classList.remove('cloud--animate', 'cloud--scroll-animate')
				cloudTop.classList.remove('cloud__particle-top--animate')
				cloudBottom.classList.remove('cloud__bottom--animate')

				window.removeEventListener('resize', handleChangeOnResize)
				document.removeEventListener('animationend', handleAnimationEnd)
			}

			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		animateCloud()

		function animateExperience() {
			const elements = {
				container: document.getElementById('exp-inner-content'),
				firstElement: document.getElementById('exp-element-0'),
				top: document.getElementById('exp-top'),
				start: document.getElementById('exp-start'),
				bottomLine: document.getElementById('exp-bottom-line'),
			}

			const queryElements = {
				boxElements: document.querySelectorAll('.exp__box'),
				centerLine: document.querySelectorAll('.exp__center-line'),
				horizontalLine: document.querySelectorAll('.exp__horizont-line'),
				circle: document.querySelectorAll('.exp__circle'),
				hiddenText: document.querySelectorAll('.exp__hidden-text'),
				text: document.querySelectorAll('.exp__text'),
			}

			const ids = []
			const elementKeys = []
			const startHeight = 0

			const elementSeen = []
			let currentStepIndex = 0

			queryElements.boxElements.forEach((_, index) => {
				const elementId = document.getElementById(`exp-element-${index}`)
				if (elementId) ids.push(elementId)

				elementSeen.push(`exp-element-${index}`)
				elementKeys.push(`exp-element-${index}`)
			})

			const isAnimation = {}
			let isStartAnimation = false

			let handleAnimationEnd = null

			function addClasses(elements, classes) {
				elements.forEach((element, index) => {
					element.classList.add(index % 2 === 0 ? `${classes}--left` : `${classes}--right`)
				})
			}

			addClasses(queryElements.horizontalLine, 'exp__horizont-line')
			addClasses(queryElements.hiddenText, 'exp__hidden-text')
			addClasses(queryElements.text, 'exp__text')

			function handleStartAnimation(event) {
				if (event.animationName === 'exp-top' && !isStartAnimation) {
					isStartAnimation = true
					handleAnimation()
				}
			}

			function handleAnimation(stepIndex = currentStepIndex) {
				if (currentStepIndex >= queryElements.boxElements.length) return

				if (!isAnimation[currentStepIndex]) {
					isAnimation[currentStepIndex] = { isStarted: false, isEnded: false }
				}

				if (seenElements.has(elementSeen[currentStepIndex]) && !isAnimation[currentStepIndex]?.isStarted) {
					isAnimation[currentStepIndex].isStarted = true

					queryElements.centerLine[currentStepIndex].classList.add('exp__center-line--animate')
					queryElements.horizontalLine[currentStepIndex].classList.add(currentStepIndex % 2 === 0 ? 'exp__horizont-line--left-animate' : 'exp__horizont-line--right-animate')

					handleAnimationEnd = async event => {
						const { animationName } = event

						if (animationName === 'exp-center-line' && !isAnimation[currentStepIndex].isEnded && seenElements.has(elementSeen[currentStepIndex])) {
							isAnimation[currentStepIndex].isEnded = true
							queryElements.circle[currentStepIndex].classList.add(currentStepIndex % 2 === 0 ? 'exp__circle--left' : 'exp__circle--right')
							queryElements.text[currentStepIndex].classList.add(currentStepIndex % 2 === 0 ? 'exp__text--left-animate' : 'exp__text--right-animate')
							queryElements.boxElements[currentStepIndex].classList.add('exp__box--animate')

							await new Promise(resolve => {
								queryElements.centerLine[currentStepIndex].removeEventListener('animationend', handleAnimationEnd)
								setTimeout(resolve, 10)
							})

							currentStepIndex = stepIndex + 1
							handleAnimation(currentStepIndex)

							if (currentStepIndex >= queryElements.boxElements.length) {
								elements.bottomLine.classList.add('exp__bottom-line--animate')
							}
						}
					}

					queryElements.centerLine[currentStepIndex].addEventListener('animationend', handleAnimationEnd)
				}
			}

			function animate() {
				handleAnimation()

				if (seenElements.has('exp-element-0')) {
					elements.top.classList.add('exp__top--animate')
					elements.start.classList.add('exp__start--animate')
				}

				document.addEventListener('animationend', handleStartAnimation)
			}

			function reset() {
				queryElements.boxElements.forEach((_, index) => {
					queryElements.centerLine[index].classList.remove('exp__center-line--animate')
					queryElements.horizontalLine[index].classList.remove('exp__horizont-line--left-animate', 'exp__horizont-line--right-animate')
					queryElements.circle[index].classList.remove('exp__circle--left', 'exp__circle--right')
					queryElements.text[index].classList.remove('exp__text--left-animate', 'exp__text--right-animate')
					queryElements.circle[index].classList.remove('exp__circle--left', 'exp__circle--right')
					queryElements.text[index].classList.remove('exp__text--left-animate', 'exp__text--right-animate')
					queryElements.boxElements[index].classList.remove('exp__box--scroll-animate', 'exp__box--animate')

					isAnimation[index] = { isStarted: false, isEnded: false }
				})

				queryElements.centerLine.forEach(element => {
					element.removeEventListener('animationend', handleAnimationEnd)
				})

				currentStepIndex = 0

				elements.top.classList.remove('exp__top--animate')
				elements.start.classList.remove('exp__start--animate', 'exp__start--scroll-animate')
				elements.bottomLine.classList.remove('exp__bottom-line--animate', 'exp__bottom-line--scroll-animate')

				isStartAnimation = false

				document.removeEventListener('animationend', handleStartAnimation)
			}

			function scrollAnimate(_, index) {
				if (queryElements.boxElements[0].classList.contains('exp__box--scroll-animate')) elements.start.classList.add('exp__start--scroll-animate')
				if (queryElements.boxElements[queryElements.boxElements.length - 1].classList.contains('exp__box--scroll-animate')) elements.bottomLine.classList.add('exp__bottom-line--scroll-animate')

				queryElements.boxElements[index].classList.add('exp__box--scroll-animate')
			}

			function scrollReset(_, index) {
				if (!queryElements.boxElements[0].classList.contains('exp__box--scroll-animate')) elements.start.classList.remove('exp__start--scroll-animate')
				if (!queryElements.boxElements[queryElements.boxElements.length - 1].classList.contains('exp__box--scroll-animate')) elements.bottomLine.classList.remove('exp__bottom-line--scroll-animate')

				queryElements.boxElements[index].classList.remove('exp__box--scroll-animate')
			}

			handleAnimationOnScroll(queryElements.boxElements, 'exp__box--animate', elementKeys, scrollAnimate, scrollReset)
			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		animateExperience()
	}

	function usesPageEvents() {
		const texts = document.querySelectorAll('.uses-text')
		const img = document.querySelectorAll('.uses-img')

		const copyBtn = document.querySelectorAll('.uses-linters__copy-btn')
		const code = document.querySelectorAll('.uses-linters__code')

		let isModalVisible = false

		singleElementsAnimation('uses-getting-title', 0, ['uses-getting__title--animate'], null)
		singleElementsAnimation('uses-getting-subtitle', 0, ['uses-getting__subtitle--animate'], null)
		singleElementsAnimation('uses-linters-settings-title', 70, ['uses-linters__settings-title--animate'], null)
		singleElementsAnimation('uses-linters-settings-subtitle', 40, ['uses-linters__settings-subtitle--animate'], null)

		sameElementsAnimation('.uses-title', 'uses-title', ['uses-title--animate'], 50, null)
		sameElementsAnimation('.uses-btn', 'uses-btn', ['uses-btn--animate'], 50, null)
		sameElementsAnimation('.uses-img', 'uses-img', ['uses-img--animate'], 60, null)
		sameElementsAnimation('.uses-hide-group', 'uses-hide-group', ['uses-hide-group--animate'], 50, null)
		sameElementsAnimation('.uses-software__img', 'uses-software-img', ['uses-software__img--animate'], 110, 50)
		sameElementsAnimation('.uses-software__text', 'uses-software-text', ['uses-software__text--animate'], 40, 50)
		sameElementsAnimation('.uses-linters__task', 'uses-linters-task', ['uses-linters__task--animate'], 50, 100)

		function scrollText() {
			const container = document.getElementById('uses-scroll-text')
			const letters = document.querySelectorAll('.uses-scroll__letter')

			const ids = [container]
			const elementKeys = ['uses-scroll-text']
			const startHeight = 0

			const timeouts = []

			function animate() {
				letters.forEach((element, index) => {
					const timeout = setTimeout(() => {
						element.classList.add('uses-scroll__letter--animate')
					}, 60 * index)

					timeouts.push(timeout)
				})
			}

			function reset() {
				letters.forEach((element, index) => {
					element.classList.remove('uses-scroll__letter--animate')

					clearTimeout(timeouts[index])
				})

				timeouts.length = 0
			}

			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		scrollText()

		function btnsAnimate() {
			const hideEquipmentElement = document.querySelectorAll('.uses-equipment__hidden-group')
			const equipmentBtn = document.querySelectorAll('.uses-equipment__button')
			const equipmantImg = document.querySelectorAll('.uses-equipment__img')

			const hideLinterElement = document.querySelectorAll('.uses-linters__hide-group')
			const linterBtn = document.querySelectorAll('.uses-linters__btn')
			const linterImg = document.querySelectorAll('.uses-linters__img')
			const linterCode = document.querySelectorAll('.uses-linters__code')

			const climbUpBtn = document.querySelectorAll('.uses-linters__up-btn')

			const isLinterOpen = Array.from({ length: hideLinterElement.length }, () => ({
				isOpen: false,
				timeout: null,
				codeTimeout: null,
			}))

			const setId = addId(texts, 'uses-text', 60)

			const en = ['Monitor', 'PC Case', 'Chair', 'Desk', 'Keyboard', 'Mouse', 'Webcam', 'Microphone', 'Prettier', 'ESLint', 'Stylelint', 'Settings.json']
			const ru = ['Монитор', 'ПК Кейс', 'Кресло', 'Стол', 'Клавиатура', 'Мышь', 'Веб-камера', 'Микрофон', 'Prettier', 'ESLint', 'Stylelint', 'Settings.json']

			const handleTextWrite = writeAndResetText(setId.ids, en, ru, 80, setId.elementKeys, ['uses-text--rus-lang'], null)

			function openHiddenEquipmentOnClick(event) {
				const index = [...equipmentBtn].indexOf(event.target)

				if (index === -1) return

				const element = hideEquipmentElement[index]
				const images = equipmantImg[index]
				const isOpen = element.classList.contains('uses-equipment__hidden-group--open')

				equipmantImg.forEach(imgElement => imgElement.classList.remove('uses-img--open'))
				hideEquipmentElement.forEach(el => el.classList.remove('uses-equipment__hidden-group--open'))

				if (!isOpen) {
					element.classList.add('uses-equipment__hidden-group--open')
					images.classList.add('uses-img--open')
				}
			}

			function openHiddenLinterOnClick(event) {
				const index = [...linterBtn].indexOf(event.target)

				if (index === -1) return

				const element = hideLinterElement[index]
				const images = linterImg[index]
				const state = isLinterOpen[index]

				const transitionDuration = Math.max(0.5, Math.min(element.scrollHeight / 1500, 1.5))
				element.style.transition = `height ${transitionDuration}s ease-out`

				state.isOpen = !state.isOpen
				images.classList.toggle('uses-img--open')

				if (!state.isOpen) {
					clearTimeout(state.timeout)
					clearTimeout(state.codeTimeout)

					linterCode[index].removeAttribute('style')
					element.style.height = 0
				} else {
					element.style.height = `${element.scrollHeight}px`

					state.timeout = setTimeout(() => {
						linterBtn[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
					}, 550)

					state.codeTimeout = setTimeout(() => {
						linterCode[index].style.overflow = 'auto hidden'
					}, 10)
				}
			}

			function closeBtnsOnResize() {
				hideLinterElement.forEach((element, index) => {
					element.style.height = 0
					isLinterOpen[index].isOpen = false
					linterCode[index].removeAttribute('style')
				})
				hideEquipmentElement.forEach(element => element.classList.remove('uses-equipment__hidden-group--open'))
				img.forEach(element => element.classList.remove('uses-img--open'))
			}

			function climbUpLinterBtn(event) {
				const index = [...climbUpBtn].indexOf(event.target)

				if (index === -1) return

				linterBtn[index + 1].scrollIntoView({ behavior: 'smooth', block: 'start' })
			}

			function animate() {
				handleTextWrite.writeAll()

				document.addEventListener('click', openHiddenEquipmentOnClick)
				document.addEventListener('click', openHiddenLinterOnClick)
				document.addEventListener('click', climbUpLinterBtn)
				window.addEventListener('resize', closeBtnsOnResize)
			}

			function reset() {
				handleTextWrite.resetAll()

				img.forEach(el => el.classList.remove('uses-img--open'))
				hideEquipmentElement.forEach(el => el.classList.remove('uses-equipment__hidden-group--open'))
				hideLinterElement.forEach((el, index) => {
					el.style.height = 0
					linterCode[index].removeAttribute('style')

					if (isLinterOpen[index].timeout) {
						clearTimeout(isLinterOpen[index].timeout)

						isLinterOpen[index].timeout = null
					}

					if (isLinterOpen[index].isOpen) {
						isLinterOpen[index].isOpen = false
					}
				})

				document.removeEventListener('click', openHiddenEquipmentOnClick)
				document.removeEventListener('click', openHiddenLinterOnClick)
				document.removeEventListener('click', climbUpLinterBtn)
				window.removeEventListener('resize', closeBtnsOnResize)
			}

			createAnimation(setId.ids, setId.elementKeys, setId.startingHeight, animate, reset)
		}

		btnsAnimate()

		function copyText() {
			const btns = [...copyBtn]
			const texts = [...code]

			let isClicked = false

			function showModalWindow(message, classes) {
				if (isModalVisible) return
				isModalVisible = true

				const modalWindow = document.createElement('div')
				modalWindow.classList.add(...classes)
				modalWindow.textContent = message
				document.body.appendChild(modalWindow)

				setTimeout(() => {
					modalWindow.remove()
					isModalVisible = false
				}, 2000)
			}

			function cleanText(text) {
				let cleanedText = text.replace(/<\/?[^>]+(>|$)/g, '')
				cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
				return cleanedText
			}

			btns.forEach((element, index) => {
				element.addEventListener('click', () => {
					if (isClicked) return
					isClicked = true

					let textToCopy = texts[index].textContent
					textToCopy = cleanText(textToCopy)

					try {
						const jsonObject = JSON.parse(textToCopy)
						textToCopy = JSON.stringify(jsonObject, null, '\t')
					} catch (error) {
						console.warn('Текст не является валидным JSON:', textToCopy)
					}

					navigator.clipboard
						.writeText(textToCopy)
						.then(() => {
							const message = isLanguageRussian ? 'Текст скопирован' : 'Text Copied'
							const font = isLanguageRussian ? ['uses-linters__modal-window', 'russian-font', 'uses-linters__modal-window--rus-lang'] : ['uses-linters__modal-window']
							showModalWindow(message, font)
						})
						.catch(() => {
							const message = isLanguageRussian ? 'Ошибка копирования' : 'Copy Error'
							const font = isLanguageRussian ? ['uses-linters__modal-window', 'russian-font', 'uses-linters__modal-window--rus-lang'] : ['uses-linters__modal-window']
							showModalWindow(message, font)
						})
						.finally(() => {
							setTimeout(() => {
								isClicked = false
							}, 2000)
						})
				})
			})
		}

		copyText()
	}

	function resumePageEveents() {
		sameElementsAnimation('.resume-title', 'resume-title', ['resume-title--animate'], 80, null)
		sameElementsAnimation('.resume-btn-box', 'resume-btn', ['resume-btn-box--animate'], 80, null)
		sameElementsAnimation('.resume-feedback__input-box', 'resume-feedback-input-box', ['resume-feedback__input-box--animate'], 20, null)
		sameElementsAnimation('.resume-subtitle', 'resume-subtitle', ['resume-subtitle--animate'], 80, null)

		function gettingAnimate() {
			singleElementsAnimation('resume-getting-title', 80, ['resume-getting__title--animate'], null)

			function subtitle() {
				const subtitles = document.querySelectorAll('.resume-getting__subtitle')
				const setIds = addId(subtitles, 'resume-getting-subtitle', 80)

				const isAnimation = {}

				function animate() {
					subtitles.forEach((element, index) => {
						if (seenElements.has(setIds.elementKeys[index])) {
							if (!isAnimation[index]) {
								isAnimation[index] = { animated: false, timeout: null }
							}

							if (!isAnimation[index].animated) {
								isAnimation[index].animated = true

								isAnimation[index].timeout = setTimeout(() => {
									element.classList.add('resume-getting__subtitle--animate')
								}, 300 * index)
							}
						}
					})
				}

				function reset() {
					subtitles.forEach((element, index) => {
						if (isAnimation[index]?.timeout) {
							clearTimeout(isAnimation[index].timeout)
							isAnimation[index].timeout = null
						}

						if (isAnimation[index]?.animated) {
							isAnimation[index].animated = false
						}

						element.classList.remove('resume-getting__subtitle--animate')
					})
				}

				createAnimation(setIds.ids, setIds.elementKeys, setIds.startingHeight, animate, reset)
			}

			subtitle()
		}

		gettingAnimate()

		function scrollText() {
			const container = document.getElementById('resume-scroll-text')
			const letters = document.querySelectorAll('.resume-scroll__letter')

			const ids = [container]
			const elementKeys = ['resume-scroll-text']
			const startHeight = 0

			letters.forEach((element, index) => {
				element.classList.add(index % 2 !== 0 ? 'resume-scroll__letter--top' : 'resume-scroll__letter--bottom')
			})

			function animate() {
				letters.forEach(element => {
					if (element.classList.contains('resume-scroll__letter--top')) {
						element.classList.add('resume-scroll__letter--animate-top')
					}

					if (element.classList.contains('resume-scroll__letter--bottom')) {
						element.classList.add('resume-scroll__letter--animate-bottom')
					}
				})
			}

			function reset() {
				letters.forEach(element => {
					element.classList.remove('resume-scroll__letter--animate-top', 'resume-scroll__letter--animate-bottom')
				})
			}

			createAnimation(ids, elementKeys, startHeight, animate, reset)
		}

		scrollText()

		function feedbackAnimate() {
			function textWrite() {
				const texts = document.querySelectorAll('.resume-feedback__text')
				const form = document.getElementById('resume-feedback-form')

				const setId = addId(texts, 'resume-feedback-text', 80)

				const en = ['Name', 'Email', 'Message']
				const ru = ['Имя', 'Email', 'Сообщение']

				const handleTextWrite = writeAndResetText(setId.ids, en, ru, 70, setId.elementKeys, null, null)

				function animate() {
					form.classList.add('resume-feedback__form--animate')
					handleTextWrite.writeAll()
				}

				function reset() {
					handleTextWrite.resetAll()

					form.classList.remove('resume-feedback__form--animate')
				}

				createAnimation(setId.ids, setId.elementKeys, setId.startingHeight, animate, reset)
			}

			textWrite()

			function autoResizeTextarea() {
				const textarea = document.getElementById('resume-feedback-message')

				textarea.style.height = 'auto'
				textarea.style.height = textarea.scrollHeight + 'px'
			}

			document.addEventListener('input', autoResizeTextarea)
		}

		feedbackAnimate()
	}

	function setCurrentDate() {
		const date = document.getElementById('footer-current-date')
		const setCurrentDate = new Date()
		const langState = !isLanguageRussian ? 'en-US' : 'ru-RU'

		date.classList[isLanguageRussian ? 'add' : 'remove']('russian-font', 'footer__date--rus-lang')

		const options = { year: 'numeric', month: 'long' }
		date.textContent = setCurrentDate.toLocaleString(langState, options)
	}

	function footerEvents() {
		const date = document.getElementById('footer-current-date')
		const name = document.getElementById('footer-name')
		const version = document.getElementById('footer-version')
		const wrapper = document.getElementById('footer-wrapper')
		const symbol = document.getElementById('footer-symbol')
		const line = document.getElementById('footer-line')

		const ids = [wrapper, name, version]
		const elementKeys = ['footer-wrapper', 'footer-name', 'footer-version']
		const startHeight = 0

		const timeouts = []

		const handleTextWrite = [
			writeAndResetText([name], ['Bakidjanov Sunnat'], ['Бакиджанов Суннат'], 50, ['footer-name'], ['footer__name--rus-lang'], null),
			writeAndResetText([version], ['Version 1.0.0'], ['Версия 1.0.0'], 50, ['footer-version'], ['footer__version--rus-lang'], null),
		]

		function animate() {
			wrapper.classList.add('footer__wrapper--animate')
			symbol.classList.add('footer__symbol--animate')

			const textTimeout = setTimeout(() => {
				handleTextWrite[0].writeAll()
			}, 300)

			const dateTimeout = setTimeout(() => {
				date.classList.add('footer__date--animate')
				line.classList.add('footer__line--animate')
			}, 600)

			const versionTimeout = setTimeout(() => {
				handleTextWrite[1].writeAll()
			}, 1200)

			timeouts.push(textTimeout, dateTimeout, versionTimeout)
		}

		function reset() {
			wrapper.classList.remove('footer__wrapper--animate')
			symbol.classList.remove('footer__symbol--animate')
			date.classList.remove('footer__date--animate')
			line.classList.remove('footer__line--animate')

			handleTextWrite.forEach(text => {
				text.resetAll()
			})

			timeouts.forEach(timeout => {
				clearTimeout(timeout)
			})
		}

		createAnimation(ids, elementKeys, startHeight, animate, reset)
	}

	window.addEventListener('load', () => {
		sameElementsAnimation('.line', 'line', ['line--animate'], 50, null)
		scrollLine()
		setCurrentDate()

		switchPages()
		climbUp()
		asideMenu()
		footerEvents()
		homePageEvents()
		usesPageEvents()
		resumePageEveents()
		headerEvents()
	})

	window.addEventListener('beforeunload', () => {
		// pageUpdate()
	})

	changeLanguageButton.addEventListener('click', () => {
		isLanguageRussian = !isLanguageRussian
		const currentLanguage = isLanguageRussian ? 'ru' : 'en'

		translateText(currentLanguage, 'russian-font')

		setCurrentDate()

		function homePageTextEdit() {
			const cardsText = document.querySelectorAll('.hmp-cards__progress-text')

			manageClasses(cardsText, ['russian-font'], null)

			manageClasses(null, ['hmp-getting__title--rus-lang'], '.hmp-getting__title')
		}

		homePageTextEdit()

		function resumeTextEdit() {
			const subtitlesGetting = document.querySelectorAll('.resume-getting__subtitle')
			const subtitles = document.querySelectorAll('.resume-subtitle')
			const titles = document.querySelectorAll('.resume-title')
			const label = document.querySelectorAll('.resume-feedback__label')
			const copyBtn = document.querySelectorAll('.uses-linters__copy-btn')
			const pasteTextSpan = document.querySelectorAll('.uses-linters__paste-text--accent')
			const pasteText = document.querySelectorAll('.uses-linters__paste-text')

			manageClasses(subtitlesGetting, ['resume-getting__subtitle--rus-lang'], null)
			manageClasses(subtitles, ['resume-subtitle--rus-lang'], null)
			manageClasses(titles, ['resume-title--rus-lang'], null)
			manageClasses(label, ['resume-feedback__label--rus-lang'], null)
			manageClasses(copyBtn, ['uses-linters__copy-btn--rus-lang'], null)
			manageClasses(pasteTextSpan, ['russian-font'], null)
			manageClasses(pasteText, ['uses-linters__paste-text--rus-lang'], null)

			manageClasses(null, ['resume-feedback__form-btn--rus-lang'], '.resume-feedback__form-btn')
			manageClasses(null, ['resume-download__link--rus-lang'], '.resume-download__link')
			manageClasses(null, ['resume-getting__title--rus-lang'], '.resume-getting__title')
			manageClasses(null, ['resume-feedback__label--textarea-rus-lang'], '.resume-feedback__label--textarea')
		}

		resumeTextEdit()

		function usesTextEdit() {
			const titles = document.querySelectorAll('.uses-title')
			const equipmentHideText = document.querySelectorAll('.uses-equipment__hidden-text')
			const softwareText = document.querySelectorAll('.uses-software__text')
			const linterTasksText = document.querySelectorAll('.uses-linters__task')

			manageClasses(titles, ['uses-title--rus-lang'], null)
			manageClasses(equipmentHideText, ['uses-equipment__hidden-text--rus-lang'], null)
			manageClasses(softwareText, ['uses-software__text--rus-lang', 'russian-font'], null)
			manageClasses(linterTasksText, ['uses-linters__task--rus-lang'], null)

			manageClasses(null, ['uses-getting__title--rus-lang'], '.uses-getting__title')
			manageClasses(null, ['uses-getting__subtitle--rus-lang'], '.uses-getting__subtitle')
			manageClasses(null, ['uses-linters__settings-title--rus-lang'], '.uses-linters__settings-title')

			function settingToggleClasses() {
				const fontText = document.querySelector('.uses-linters__settings-subtitle--font-color')
				const accentText = document.querySelector('.uses-linters__settings-subtitle--span')

				fontText.classList.toggle('uses-linters__settings-subtitle--accent-color', isLanguageRussian)
				accentText.classList.toggle('uses-linters__settings-subtitle--accent-color', !isLanguageRussian)
			}

			settingToggleClasses()
		}

		usesTextEdit()
	})

	window.addEventListener('orientationchange', () => {
		const orientation = screen.orientation.type

		if (orientation === 'portrait-primary' || orientation === 'landscape-primary' || orientation === 'landscape-secondary') {
			handleChangeOrintationAddClasses()
		}
	})
}

main()
