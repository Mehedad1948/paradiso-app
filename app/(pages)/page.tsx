import ThreeWindow from '@/components/threes/ThreeWindow';


export default function Home() {
  return <>
    <ThreeWindow />
    <div data-scroll className=''>

      <div className="page max-w-7xl mx-auto">
        <header>
          <h1>Paradiso</h1>
          <img className='img opacity-0' src="/john-wick-background-image.jpg" alt="" />
        </header>

        <div className="grid grid-cols-2 gap-2">

          <a href="https://www.livescience.com/octopuses-punch-fish.html" className="item item_v">
            <div className="item__image">
              <img className='img' src="/1.jpg" alt="" />
              <div className="item__meta">December 23, 2020</div>
            </div>

            <h2 className="item__title">Octopus punches fish in the head (just because it can)</h2>
            <p>Octopuses sometimes partner with fish to hunt, but the partnership comes with risks (for the fish, that is).</p>
          </a>


          <a href="https://www.livescience.com/balloon-like-comb-jelly-discovered-puerto-rico.html" className="item item_h">
            <div className="item__image">
              <img className='img' src="/2.jpg" alt="" />
              <div className="item__meta">December 01, 2020</div>
            </div>

            <h2 className="item__title">Newfound marine blob looks like 'party balloon' with two strings, scientists say</h2>
            <p>This is the first species NOAA scientists have ever discovered from video footage alone.</p>
          </a>


          <a href="https://www.livescience.com/largest-recorded-swarm-of-deep-sea-fish.html" className="item item_h">
            <div className="item__image">
              <img className='img' src="/1.jpg" alt="" />
              <div className="item__meta">November 26, 2020</div>
            </div>

            <h2 className="item__title">Swarm of eels breaks record</h2>
            <p>Before we start mining for precious metals in the darkness of the deep sea, we might try switching on the light first and observing our surroundings.</p>
          </a>


          <a href="https://www.livescience.com/mantis-shrimp-property-wars.html" className="item item_v">
            <div className="item__image">
              <img className='img' src="/3.jpg" alt="" />
              <div className="item__meta">November 03, 2020</div>
            </div>

            <h2 className="item__title">Mantis shrimp punch down</h2>
            <p>Home-stealers fought the hardest for smaller-than-ideal dens.</p>
          </a>



          <a href="https://www.livescience.com/megalodon-big-for-a-shark.html" className="item item_v">
            <div className="item__image">
              <img className='img' src="/1.jpg" alt="" />
              <div className="item__meta">October 05, 2020</div>
            </div>

            <h2 className="item__title">Megalodon's hugeness</h2>
            <p>Even among its extinct relatives, Megalodon was unequalled in length and mass.</p>
          </a>


          <a href="https://www.livescience.com/tiny-sunfish-larva.html" className="item item_h">
            <div className="item__image">
              <img className='img' src="/2.jpg" alt="" />
              <div className="item__meta">July 27, 2020</div>
            </div>

            <h2 className="item__title">Adorable sunfish</h2>
            <p>Sunfish in the Molidae family are among the biggest fish in the world.</p>
          </a>


          <a href="https://www.livescience.com/supergiant-isopod-newfound-species.html" className="item item_h">
            <div className="item__image">
              <img className='img' src="/2.jpg" alt="" />
              <div className="item__meta">August 18, 2020</div>
            </div>

            <h2 className="item__title">Massive 'Darth Vader' sea bug</h2>
            <p>The newly described species is one of the biggest isopods known to science.</p>
          </a>


          <a href="https://www.livescience.com/worlds-deepest-octopus.html" className="item item_v">
            <div className="item__image">
              <img className='img' src="/3.jpg" alt="" />
              <div className="item__meta">June 01, 2020</div>
            </div>

            <h2 className="item__title">Scientists capture the world's deepest octopus</h2>
            <p>The octopus was found miles beneath the ocean surface.</p>
          </a>

        </div>



        <footer className="footer">
          <p>&copy; all news from <a href="https://www.livescience.com/topics/ocean">LiveScience</a></p>
          <p>
            This page was made for <a href="https://www.awwwards.com/academy/course/merging-webgl-and-html-worlds">Merging WebGL and HTML course on Awwwards.com</a>
            <br />Wish you a good day! =)</p>
        </footer>

      </div>


    </div>
  </>
}
