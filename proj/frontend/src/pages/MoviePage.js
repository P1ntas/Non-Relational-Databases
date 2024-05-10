import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Alert, Input, Button, List, Typography, Empty, Avatar, Tag, Descriptions } from 'antd';
import { LikeOutlined, LikeTwoTone, DislikeOutlined, DislikeTwoTone } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import BaseLayout from '../components/BaseLayout';
import useUserData from '../hook/useUserData';

const { Title, Text } = Typography;

function MoviePage() {
  const [movie, setMovie] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [actors, setActors] = useState(null);
  const [directors, setDirectors] = useState(null);
  const [genre, setGenre] = useState(null);
  const [similarMovies, setSimilarMovies] = useState(null);
  const [actorsInCommon, setActorsInCommon] = useState(null);
  const [likeCount, setlikeCount] = useState(null);

  const [videoError, setVideoError] = useState(false);
  const user = useUserData();

  const { movieId } = useParams();
  useEffect(() => {
    if (!user) return; // If user is not available, do nothing

    async function fetchMovieDetails() {
      try {
        const responseMovie = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}`);
        setMovie(responseMovie.data);
      } catch (error) {
        console.error('Failed to fetch movie:', error);
      }

      try {
        const commentsResponse = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/comment`);
        const commentsData = commentsResponse.data;

        // Fetch user information for each comment and handle cases where user is not found
        const commentsWithUsernames = await Promise.all(commentsData.map(async (comment) => {
          const userId = comment._from;
          try {
            const userResponse = await axios.get(`http://localhost:3000/user/${encodeURIComponent(userId)}`);
            const userData = userResponse.data.user;
            return { ...comment, username: userData.username };
          } catch (error) {
            return { ...comment, username: userId };
          }
        }));
        setComments(commentsWithUsernames);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    }

    async function fetchAdditionalData() {
      try {
        const actorsResponse = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/actors`);
        setActors(actorsResponse.data);
      } catch (error) {
        console.error('Failed to fetch actors:', error);
      }

      try {
        const directorsResponse = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/directors`);
        setDirectors(directorsResponse.data);
      } catch (error) {
        console.error('Failed to fetch directors:', error);
      }

      try {
        const likeStatusResponse = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/like/${encodeURIComponent(user.id)}`);
        setIsLiked(likeStatusResponse.data === 1);
      } catch (error) {
        console.error('Failed to fetch like status:', error);
      }

      try {
        const genreResponse = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/genre`);
        setGenre(genreResponse.data[0].label);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }

      try {
        const likeCountResponse = await axios.get(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/likes`);
        setlikeCount(likeCountResponse.data);
        console.log("Like Count: " + likeCountResponse.data)
      } catch (error) {
        console.error('Failed to fetch like count:', error);
      }
    }

    async function fetchSimilarMovies() {
      try {
        const similarResponse = await axios.get(`http://localhost:3000/movies/similar/${encodeURIComponent(movieId)}`);
        console.log(similarResponse.data)
        setSimilarMovies(similarResponse.data);
      } catch (error) {
        console.error('Failed to fetch actors:', error);
      }
    }

    async function fetchMoviesWithActorsInCommon() {
      try {
        const commonResponse = await axios.get(`http://localhost:3000/movies/actorsInCommon/${encodeURIComponent(movieId)}`);
        console.log(commonResponse.data)
        setActorsInCommon(commonResponse.data);
      } catch (error) {
        console.error('Failed to fetch actors:', error);
      }
    }


    fetchMovieDetails();
    fetchAdditionalData();
    fetchSimilarMovies();
    fetchMoviesWithActorsInCommon();
  }, [user, movieId]);

  const handleSubmit = async () => {
    const payload = {
      _from: user.id,
      _to: `${movieId}`,
      content: newComment,
      timestamp: new Date().toISOString(),
      $label: "comments"
    };

    try {
      await axios.post(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/comment`, payload);
      setComments(prevComments => [...prevComments, { ...payload, _id: `new_${Date.now()}`, username: user.username }]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleLike = () => {
    const newLikeStatus = isLiked ? 0 : 1;
    axios.post(`http://localhost:3000/movies/${encodeURIComponent(movieId)}/like/${encodeURIComponent(user.id)}`, { like: newLikeStatus })
      .then(() => setIsLiked(newLikeStatus === 1))
      .catch(error => console.error('Failed to update like status:', error));
  };

  const handleVideoError = () => {
    setVideoError(true); // Set video error state to true
  };

  const renderGenreTag = () => {
    if (!genre) return null;
    const genreColors = {
      horror: 'red',
      comedy: 'gold',
      action: 'blue',
      adventure: 'green',
      drama: 'magenta',
      animation: 'cyan',
      crime: 'volcano',
      crime: 'volcano',
      documentary: 'lime',
      "science fiction": 'purple'
    };

    const color = genreColors[genre.toLowerCase()] || 'default';
    return <Tag color={color}>{genre}</Tag>;
  };


  return (
    <BaseLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {movie ? (
          <>
            <Title level={1} style={{ margin: 0 }}>{movie.title}</Title>
            <Text type="secondary" style={{ marginBottom: 20 }}>{movie.tagline}</Text>
            <div style={{ marginTop: 10, marginBottom: 20 }}>{renderGenreTag()}</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f0f0', borderRadius: 20, padding: '6px 15px' }}>
                {isLiked ? (
                  <>
                    <LikeTwoTone style={{ fontSize: 20, cursor: 'pointer' }} onClick={handleLike} />
                    <div style={{ borderLeft: '1px solid lightgrey', height: 18, margin: '0 12px' }}></div>
                    <DislikeOutlined style={{ fontSize: 20, color: 'grey', cursor: 'pointer' }} onClick={handleLike} />
                  </>
                ) : (
                  <>
                    <LikeOutlined style={{ fontSize: 20, color: 'grey', cursor: 'pointer' }} onClick={handleLike} />
                    <div style={{ borderLeft: '1px solid lightgrey', height: 18, margin: '0 12px' }}></div>
                    <DislikeTwoTone style={{ fontSize: 20, cursor: 'pointer' }} onClick={handleLike} />
                  </>
                )}
              </div>
              {likeCount && (
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: 20 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 8 }}>Likes:</span>
                    <span style={{ fontSize: 18, marginRight: 16 }}>{likeCount.likes}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: 8 }}>Dislikes:</span>
                    <span style={{ fontSize: 18, marginRight: 16 }}>{likeCount.dislikes}</span>
                  </div>
                </div>
              )}
            </div>
            <Descriptions>
              <Descriptions.Item label="Studio">{movie.studio ? movie.studio : "N/A"}</Descriptions.Item>

              <Descriptions.Item label="Runtime">{movie.runtime ? movie.runtime + " minutes" : "N/A"}</Descriptions.Item>
              <br></br>
              <Descriptions.Item label="Description">{movie.description ? movie.description : "N/A"}</Descriptions.Item>
            </Descriptions>
            {/* {!videoError && (
              <ReactPlayer
                url={movie.trailer}
                onError={handleVideoError}
              />
            )} */}
          </>
        ) : (
          <Alert message="Movie not found" type="error" />
        )}

        {directors && directors.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Title level={4}>Directed by</Title>
            <List
              bordered
              dataSource={directors}
              renderItem={director => (
                <List.Item>
                  <Link to={`/person/${encodeURIComponent(director._id)}`}>{director.name}</Link>
                </List.Item>
              )}
            />
          </div>
        )}

        {actors && actors.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Title level={4}>Cast</Title>
            <div style={{ maxHeight: 250, overflowY: 'auto', border: '0.5px solid #ddd', borderRadius: 9 }}>
              <List
                dataSource={actors}
                renderItem={actor => (
                  <List.Item style={{ padding: '0.8em 2em' }}>
                    <Link to={`/person/${encodeURIComponent(actor._id)}`}>{actor.name}</Link>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}


        <div style={{ marginTop: 24 }}>
          <Title level={4}>Comments</Title>
          {comments && comments.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={comments}
              renderItem={(comment, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`} />}
                    title={<Link to={`/${comment._from}`}>{comment.username}</Link>}
                    description={comment.content}
                  />
                  <div>{comment.timestamp}</div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No comments yet" />
          )}
          <Input.TextArea
            value={newComment}
            placeholder="Write a comment..."
            onChange={e => setNewComment(e.target.value)}
            style={{ marginTop: 16 }}
          />
          <Button className="button" type="primary" style={{ marginTop: 8 }} onClick={handleSubmit}>Submit Comment</Button>
        </div>

        {similarMovies && similarMovies.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Title level={4}>Movies with similar description</Title>
            <div style={{ maxHeight: 250, overflowY: 'auto', border: '0.5px solid #ddd', borderRadius: 9 }}>
              <List
                dataSource={similarMovies}
                renderItem={similarMovie => (
                  <List.Item style={{ padding: '0.8em 2em' }}>
                    <Link to={`/person/${encodeURIComponent(similarMovie._id)}`}>{similarMovie.title}</Link>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}

        {actorsInCommon && actorsInCommon.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Title level={4}>Movies with actors in common</Title>
            <div style={{ maxHeight: 250, overflowY: 'auto', border: '0.5px solid #ddd', borderRadius: 9 }}>
              <List
                dataSource={actorsInCommon}
                renderItem={common => (
                  <List.Item style={{ padding: '0.8em 2em' }}>
                    <Link to={`/movie/${encodeURIComponent(common.movieId)}`}>{common.title}</Link>
                    <div>
                      {common.commonActors.map(actor => actor.name).join(', ')}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}

      </div>
    </BaseLayout>
  );
}

export default MoviePage;
