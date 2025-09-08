// Make Elementor Swiper slides clickable (don't scroll the page on simple clicks)
jQuery(function ($) {
  const THRESHOLD = 6; // px movement to treat as a drag

  function patchSwiper(swiper) {
    if (!swiper || swiper.__patched) return;
    swiper.__patched = true;

    // Let real clicks fire
    swiper.params.preventClicks = false;
    swiper.params.preventClicksPropagation = false;

    // Make mousewheel less aggressive (optional)
    if (!swiper.params.mousewheel) swiper.params.mousewheel = {};
    Object.assign(swiper.params.mousewheel, {
      forceToAxis: true,
      releaseOnEdges: true,
      sensitivity: 0.6,
    });

    let startX = 0, startY = 0, moved = false;

    const getPoint = (e) =>
      e?.changedTouches?.[0] || e?.touches?.[0] || e?.pointer || e || {};

    swiper.on('touchStart', (s, e) => {
      const p = getPoint(e);
      startX = p.clientX || 0;
      startY = p.clientY || 0;
      moved = false;
    });

    swiper.on('touchMove', (s, e) => {
      const p = getPoint(e);
      const dx = Math.abs((p.clientX || 0) - startX);
      const dy = Math.abs((p.clientY || 0) - startY);
      moved = moved || dx > THRESHOLD || dy > THRESHOLD;
    });

    // Re-enable click for taps (so links/buttons inside slides work)
    swiper.on('touchEnd', (s, e) => {
      if (moved) return; // it was a drag, do nothing
      const target = e.target?.closest('a,button,[role="button"],[data-click]'); 
      if (target) {
        // Let native click happen immediately
        target.click();
      }
    });

    swiper.update();
  }

  // Patch existing and future Elementor Swiper instances
  const patchInScope = ($scope) => {
    $scope.find('.elementor-swiper, .swiper, .swiper-container').each(function () {
      // Elementor exposes the Swiper instance on the element
      const s = this.swiper || $(this).data('swiper');
      if (s) patchSwiper(s);
    });
  };

  // Initial pass
  patchInScope($(document));

  // When Elementor widgets mount
  if (window.elementorFrontend?.hooks) {
    elementorFrontend.hooks.addAction('frontend/element_ready/global', patchInScope);
    elementorFrontend.hooks.addAction('frontend/element_ready/widget', patchInScope);
    elementorFrontend.hooks.addAction('frontend/element_ready/section', patchInScope);
    elementorFrontend.hooks.addAction('frontend/element_ready/column', patchInScope);
  }
});
