/* Slugifikacija naslova — zajednički modul za site/build.mjs (id-evi h2/h3 na
 * sajtu) i tests/guards.test.mjs (provera sidra #... u internim linkovima), da
 * test i build nikad ne odstupaju o algoritmu.
 *
 * srpske dijakritike u ASCII, pa slug — da sidro „Šta je agent?" bude #sta-je-agent
 */

export const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");

const deSerb = (s) =>
  s.replace(/[čć]/g, 'c').replace(/Č/g, 'C').replace(/Ć/g, 'C')
   .replace(/ž/g, 'z').replace(/Ž/g, 'Z')
   .replace(/š/g, 's').replace(/Š/g, 'S')
   .replace(/đ/g, 'dj').replace(/Đ/g, 'Dj');

export const slugify = (s) =>
  deSerb(decodeEntities(s).replace(/<[^>]+>/g, '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sekcija';
