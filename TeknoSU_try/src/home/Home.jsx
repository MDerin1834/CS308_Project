import React from 'react'
import Banner from './Banner'
import HomeCategory from './HomeCategory'
import CategoryShowCase from './CategoryShowCase'
import AppSection from './AppSection'


const Home = () => {
  return (
    <div>
        <Banner/>
        <HomeCategory/>
        <CategoryShowCase/>
        <AppSection/>
        
    </div>
  )
}

export default Home