import React, { useEffect, useState } from 'react';
import Pbf from 'pbf'
import testProfile from './extreme.pbf'
import { SamplerData } from './proto'
import { Sampler } from './types/Sampler';

function Footer() {
    return (
        <>
            <div id="footer">
                <a href="https://github.com/lucko/spark">spark</a> is based on <a href="http://github.com/sk89q/WarmRoast">WarmRoast</a> by sk89q.<br />
                <a href="https://github.com/astei/spark-ignition">spark-ignition</a> is &copy; 2020 Andrew Steinborn. Licensed under the MIT license.
            </div>
        </>
    )
}

export default function SparkRoot() {
    const [loaded, setLoaded] = useState(null)

    useEffect(() => {
        async function onLoad() {
            const resp = await fetch(testProfile);
            const data = new Pbf(new Uint8Array(await resp.arrayBuffer()))
            const deserialized = SamplerData.read(data)
            console.log(deserialized)
            setLoaded(deserialized)
        }

        onLoad()
    }, [])

    const contents = !loaded ? <div id="loading">Rendering data; please wait...</div> : <Sampler data={loaded} />
    return <>
        {contents}
        <Footer />
    </>
}