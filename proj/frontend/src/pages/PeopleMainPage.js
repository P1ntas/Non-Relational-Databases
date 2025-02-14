import React, { useState, useEffect } from 'react';
import { Card, Input } from 'antd';
import axios from 'axios';
import { Link } from 'react-router-dom';
import BaseLayout from '../components/BaseLayout';

const { Search } = Input;

const PeopleMainPage = () => {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/entity/mostLikes/Person`);
      setPeople(response.data.entitiesWithMostLikesDifference);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onSearch = async (value) => {

    try {
      if(value){
        const response = await axios.get(`http://localhost:3000/person/search/${encodeURIComponent(value)}`);
        setPeople(response.data);
      }
      else {
        const response = await axios.get(`http://localhost:3000/entity/mostLikes/Person`);
        setPeople(response.data.entitiesWithMostLikesDifference);
      }

    } catch (error) {
      console.error('Error searching movies:', error);
    }
  };


  return (
    <BaseLayout>
      <Search placeholder="search for people" onSearch={onSearch} style={{ width: 400, marginLeft: 50 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {people.map(person => (
          <Link to={`/person/${encodeURIComponent(person._id)}`} key={person._id}>
            <Card
              style={{ width: 215, margin: '1.5em', marginBottom: '1em' }}
              hoverable>
              <h4>{person.name}</h4>
            </Card>
          </Link>
        ))}
      </div>
    </BaseLayout>
  );
};
export default PeopleMainPage;
